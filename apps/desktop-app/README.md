### 仅适用于`wails3 dev`启动的必要修改
由于当前版本 wails v3 的frontend目录位置在构建配置文件中大量硬编码，修改前端目录位置会相当麻烦

windows 构建配置[build/windows/Taskfile.yml](build/windows/Taskfile.yml#L31)中的`build:native`被修改以绕开前端构建，并将绑定生成提前到此:
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
      - task: common:generate:bindings
        vars:
            BUILD_FLAGS:
              ref: .BUILD_FLAGS
      - task: common:generate:icons
```

全局构建配置[build/Taskfile.yml](build/Taskfile.yml#L83)的绑定生成任务修改目标以输出到`@astraea/core-desktop`下:
```yml
    generate:bindings:
    label: generate:bindings (BUILD_FLAGS={{.BUILD_FLAGS}})
    summary: Generates bindings for the frontend
    deps:
      - task: go:mod:tidy
    sources:
      - "**/*.[jt]s"
      - exclude: ../../packages/core-desktop/**/*
      - ../../packages/core-desktop/bindings/**/*  # Rerun when switching between dev/production mode causes changes in output
      - "**/*.go"
      - go.mod
      - go.sum
    generates:
      - ../../packages/core-desktop/bindings/**/*
    cmds:
      - wails3 generate bindings -f '{{.BUILD_FLAGS}}' -clean=true -ts -d "../../packages/core-desktop/bindings"
```

全局构建配置[build/Taskfile.yml](build/Taskfile.yml#L112)的前端dev启动修改:
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

全局构建配置[build/config.yml](build/config.yml#L34)的hmr监控位置修改，禁用所有hmr，debounce为5秒:
```yml
dev_mode:
  root_path: .
  log_level: warn
  debounce: 5000
  ignore:
    dir:
      - .git
      - node_modules
      - frontend
      - bin
    file:
      - .DS_Store
      - .gitignore
      - .gitkeep
    watched_extension:
      # - "*.go"
      # - "*.js" # Watch for changes to JS/TS files included using the //wails:include directive.
      # - "*.ts" # The frontend directory will be excluded entirely by the setting above.
```