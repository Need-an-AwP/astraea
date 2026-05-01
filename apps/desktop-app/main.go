package main

import (
	"embed"
	_ "embed"
	"log"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

// _____not_including_frontend_build_artifacts_in_dev_mode______go:embed all:../web-client/dist
var assets embed.FS

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")
}

func main() {

	windowActions := &WindowActions{}

	app := application.New(application.Options{
		Name:        "astraea-desktop",
		Description: "Astraea desktop application",
		Services: []application.Service{
			application.NewService(windowActions),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	mainWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "Astraea",
		Frameless:        true,
		Width:            1400, //default value
		Height:           800,  //default value
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",

		// DEV ONLY
		// InitialPosition: application.WindowXY,
		// X:               -1000,
		// Y:               300,
	})

	windowActions.window = mainWindow

	mainWindow.OnWindowEvent(events.Common.WindowShow, func(event *application.WindowEvent) {
		mainWindow.OpenDevTools()
	})

	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	err := app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}
