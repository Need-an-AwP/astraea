package main

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

type WindowActions struct {
	window *application.WebviewWindow
}

func (a *WindowActions) Close() {
	if a.window != nil {
		a.window.Close()
	}
}

func (a *WindowActions) Minimize() {
	if a.window != nil {
		a.window.Minimise()
	}
}

func (a *WindowActions) Maximize() {
	if a.window != nil {
		a.window.Maximise()
	}
}

func (a *WindowActions) Unmaximize() {
	if a.window != nil {
		a.window.UnMaximise()
	}
}

func (a *WindowActions) Resize(w int, h int) {
	if a.window != nil {
		a.window.SetSize(w, h)
	}
}

func (a *WindowActions) SetAlwaysOnTop(alwaysOnTop bool) {
	if a.window != nil {
		a.window.SetAlwaysOnTop(alwaysOnTop)
	}
}