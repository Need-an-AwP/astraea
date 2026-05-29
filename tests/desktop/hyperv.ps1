# hyperv check
$TargetVM = "windows10"

# Require admin to access Hyper-V cmdlets and VM sessions.
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
	[Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
	Write-Host "This script must be run as Administrator." -ForegroundColor Red
	exit 1
}

$VMState = Get-VM -Name $TargetVM -ErrorAction SilentlyContinue
if (-not $VMState) {
	Write-Host "Target VM '$TargetVM' not found." -ForegroundColor Red
	exit 1
}
if ($VMState.State -ne 'Running') {
	Write-Host "use 'start-vm -n $TargetVM' to start the target VM first." -ForegroundColor Yellow
	Write-Host "Target VM '$TargetVM' ($($VMState.State)) is not running." -ForegroundColor Red
	exit 1
}



# credentials
$Account = "hyperv"
$Password = "2333"
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential($Account, $SecurePassword)

# background session
$Session = New-PSSession -VMName $TargetVM -Credential $Cred

# Fetch system info inside the VM.
$vmSystemInfo = Invoke-Command -Session $Session -ScriptBlock {
	Get-ComputerInfo | Select-Object CsName, WindowsProductName, WindowsVersion, OsBuildNumber, OsArchitecture
}
Write-Host "login successful. System info:" -ForegroundColor Green
$vmSystemInfo

# Check WebView2 availability inside the VM.
$RegistryPath = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
try {
	$webviewInfo = Invoke-Command -Session $Session -ScriptBlock {
		Get-ItemProperty -Path $using:RegistryPath -ErrorAction Stop
	}
	Write-Host "WebView2 found at '$RegistryPath':" -ForegroundColor Green
	$webviewInfo
}
catch {
	Write-Host "WebView2 not found at '$RegistryPath'." -ForegroundColor Red
	exit 1
}

# check active logon (desktop) session
$Sessions = Invoke-Command -Session $Session -ScriptBlock {
	# quser outputs tabular string, we need to handle potential empty session names
	# Format: USERNAME              SESSIONNAME        ID  STATE   IDLE TIME  LOGON TIME
	$result = quser 2>&1
	if ($result -is [System.Management.Automation.ErrorRecord]) {
		# quser returns error if no users are logged in (e.g. exit code 1)
		return $null
	}
	return $result
}

if (-not $Sessions) {
	Write-Host "quser returned empty or error. No active user logged in." -ForegroundColor Red
	exit 1
}

$ActiveSessionId = $null
$ActiveUser = $null

foreach ($line in $Sessions) {
	# Skip the header row
	if ($line -match "USERNAME") { continue }
	
	# quser output often prefixes the current session username with '>'
	$cleanLine = $line -replace '^>', ''
	
	# Use regex to dynamically parse the tabular data
	# It matches: user (required), session (optional, can be empty), id (required), state (required)
	# Since sessionname might be empty for disconnected or some background sessions, 
	# we look specifically for lines containing 'Active' state.
	$match = [regex]::Match($cleanLine, '^\s*(\S+)\s+(?:(\S+)\s+)?(\d+)\s+(Active)\s+')
	
	if ($match.Success) {
		$parsedUser = $match.Groups[1].Value
		$parsedSessionName = $match.Groups[2].Value  # Could be 'console', 'rdp-tcp...', or empty
		$parsedId = $match.Groups[3].Value
		$parsedState = $match.Groups[4].Value
		
		# An Active state inherently means a desktop session is rendering for that user
		if ($parsedState -eq 'Active') {
			$ActiveUser = $parsedUser
			$ActiveSessionId = $parsedId
			break
		}
	}
}

if (-not $ActiveSessionId) {
	Write-Host "quser output parsed, but no 'Active' desktop session found in VM." -ForegroundColor Red
	$Sessions | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
	exit 1
}
Write-Host "Active desktop session found: user=$ActiveUser, id=$ActiveSessionId" -ForegroundColor Green


# copy test executable file to VM
$ExePath = "C:\astraea-desktop.exe"
try {
	Copy-Item -Path "..\..\apps\desktop-app\bin\astraea-desktop.exe" -ToSession $Session -Destination $ExePath -ErrorAction Stop
}
catch {
	Write-Host "Failed to copy test executable file to VM." -ForegroundColor Red
	Write-Host $_ -ForegroundColor Red
	exit 1
}
Write-Host "Test executable file copied to VM's desktop successfully." -ForegroundColor Green

# run the exe by scheduled task in VM
Invoke-Command -Session $Session -ScriptBlock {
	$Action = New-ScheduledTaskAction -Execute $using:ExePath
	$Task = New-ScheduledTask -Action $Action
	Register-ScheduledTask -TaskName "RunTestApp" -InputObject $Task
	Start-ScheduledTask -TaskName "RunTestApp"
	Unregister-ScheduledTask -TaskName "RunTestApp" -Confirm:$false
}

exit 0
