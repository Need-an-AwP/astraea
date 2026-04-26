### 仅适用于`wails3 dev`启动的必要修改
由于当前版本 wails v3 的frontend目录位置在构建配置文件中大量硬编码，修改前端目录位置会相当麻烦

windows 构建配置`build/windows/Taskfile.yml`中的`build:native`被修改以绕开前端构建:
```yml
  build:native:
    summary: Builds the application using native Go cross-compilation
    internal: true
    deps:
      - task: common:go:mod:tidy
      # - task: common:build:frontend
      #   vars:
      #     BUILD_FLAGS:
      #       ref: .BUILD_FLAGS
      #     DEV:
      #       ref: .DEV
      - task: common:generate:icons
```

全局构建配置`build/Taskfile.yml`的绑定生成任务修改目标以输出到指定的前端位置:
```yml
  generate:bindings:
    label: generate:bindings (BUILD_FLAGS={{.BUILD_FLAGS}})
    summary: Generates bindings for the frontend
    deps:
      - task: go:mod:tidy
    sources:
      - "**/*.[jt]s"
      - exclude: frontend/**/*
      - frontend/bindings/**/*  # Rerun when switching between dev/production mode causes changes in output
      - "**/*.go"
      - go.mod
      - go.sum
    generates:
      # - frontend/bindings/**/*
      - ../web-app/bindings/**/*
    cmds:
      - wails3 generate bindings -f '{{.BUILD_FLAGS}}' -clean=true -ts -d "../web-app/bindings"
```

全局构建配置`build/Taskfile.yml`的前端dev启动修改:
```yml
  dev:frontend:
    summary: Runs the frontend in development mode
    dir: frontend
    deps:
      # - task: install:frontend:deps
    cmds:
      - pnpm --filter web-app dev
      # - npm run dev -- --port {{.VITE_PORT}} --strictPort
```
