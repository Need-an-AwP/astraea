package main

import (
	"astraea-desktop/twn"
	"embed"
	_ "embed"
	"log"
	"time"
	"twncore"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")

	application.RegisterEvent[*twn.Ts_notify](twn.EventTsNotify)
	application.RegisterEvent[struct{}](twn.EventRequestTsNotify) // for frontend positively request ts_notify

	// events from twncore
	application.RegisterEvent[twncore.ConnectionStatePayload](string(twncore.EventConnectionState))
	application.RegisterEvent[twncore.DataChannelMessagePayload](string(twncore.EventDataChannelMessage))
	application.RegisterEvent[twncore.RTCReportPayload](string(twncore.EventRTCReport))
}

func main() {

	windowActions := &WindowActions{}

	var app *application.App

	// create service before app is created, using closure wrapper to avoid empty pointer error
	twnService := twn.NewTWNService(
		func(name string, data ...any) bool {
			if app != nil {
				return app.Event.Emit(name, data...)
			}
			return false
		},
		func(name string, callback func(event *application.CustomEvent)) func() {
			if app != nil {
				return app.Event.On(name, callback)
			}
			return func() {}
		},
	)

	app = application.New(application.Options{
		Name:        "astraea-desktop",
		Description: "Astraea desktop application",
		Services: []application.Service{
			application.NewService(windowActions),
			application.NewService(twnService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Windows: application.WindowsOptions{
			// DEV ONLY
			AdditionalBrowserArgs: []string{
				"--remote-debugging-port=9222",
			},
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
