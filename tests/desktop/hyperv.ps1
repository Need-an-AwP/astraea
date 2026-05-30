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
	if ($VMState.State -eq 'Paused') {
		Write-Host "Target VM is paused. Attempting to resume..." -ForegroundColor Yellow
		try {
			Resume-VM -Name $TargetVM -ErrorAction Stop
		}
		catch {
			Write-Host "Failed to resume VM '$TargetVM'." -ForegroundColor Red
			Write-Host $_ -ForegroundColor Red
			exit 1
		}
	}
	elseif ($VMState.State -eq 'Off') {
		Write-Host "Target VM is off. Attempting to start..." -ForegroundColor Yellow
		try {
			Start-VM -Name $TargetVM -ErrorAction Stop
		}
		catch {
			Write-Host "Failed to start VM '$TargetVM'." -ForegroundColor Red
			Write-Host $_ -ForegroundColor Red
			exit 1
		}
	}
	$VMState = Get-VM -Name $TargetVM -ErrorAction SilentlyContinue
	if ($VMState.State -ne 'Running') {
		Write-Host "use 'start-vm -n $TargetVM' to start the target VM first." -ForegroundColor Yellow
		Write-Host "Target VM '$TargetVM' ($($VMState.State)) is not running." -ForegroundColor Red
		exit 1
	}
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
	Invoke-Command -Session $Session -ScriptBlock {
		Get-ItemProperty -Path $using:RegistryPath -ErrorAction Stop
	}
	Write-Host "WebView2 found at '$RegistryPath':" -ForegroundColor Green
}
catch {
	Write-Host "WebView2 not found at '$RegistryPath'." -ForegroundColor Red
	exit 1
}

# try open a gui session by rdp
$TargetVMIP = (Get-VMNetworkAdapter -VMName $TargetVM).IPAddresses | Select-Object -First 1
$rdpProcess = Start-Process -FilePath "mstsc.exe" -ArgumentList "/v:$TargetVMIP" -PassThru


# copy test executable file to VM
$ProcessName = "astraea-desktop"
$ExePath = "C:\$ProcessName.exe"
try {
	$SourceExePath = Join-Path $PSScriptRoot "..\..\apps\desktop-app\bin\astraea-desktop.exe"
	Copy-Item -Path $SourceExePath -ToSession $Session -Destination $ExePath -ErrorAction Stop
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

Write-Host "Press Ctrl+C to stop and exit..."

$script:CleanupDone = $false
$script:Cleanup = {
	if ($script:CleanupDone) {
		return
	}
	$script:CleanupDone = $true

	if ($Session) {
		try {
			Invoke-Command -Session $Session -ScriptBlock {
				param($Name)
				Stop-Process -Name $Name -Force -ErrorAction SilentlyContinue
			} -ArgumentList $ProcessName
		}
		catch {
			Write-Host "Failed to stop VM process '$ProcessName'." -ForegroundColor Red
			Write-Host $_ -ForegroundColor Red
		}
		try {
			Remove-PSSession -Session $Session -ErrorAction SilentlyContinue
		}
		catch {
			Write-Host "Failed to remove VM session." -ForegroundColor Red
			Write-Host $_ -ForegroundColor Red
		}
	}

	if ($rdpProcess -and -not $rdpProcess.HasExited) {
		try {
			$null = $rdpProcess.CloseMainWindow()
			Wait-Process -Id $rdpProcess.Id -Timeout 3 -ErrorAction SilentlyContinue
		}
		catch {
			Write-Host "Failed to close RDP window cleanly." -ForegroundColor Yellow
		}
		if (-not $rdpProcess.HasExited) {
			try {
				Stop-Process -Id $rdpProcess.Id -Force -ErrorAction SilentlyContinue
			}
			catch {
				Write-Host "Failed to terminate RDP process." -ForegroundColor Yellow
			}
		}
	}
}

Register-EngineEvent PowerShell.Exiting -Action { & $script:Cleanup } | Out-Null

try {
	if ($rdpProcess) {
		Wait-Process -Id $rdpProcess.Id
	}
}
finally {
	& $script:Cleanup
}

exit 0
