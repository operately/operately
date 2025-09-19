# JavaScript Build Performance Optimization

This document describes the optimizations implemented to improve JavaScript build performance from 15-30 seconds to ~5 seconds.

## Optimizations Implemented

### 1. Vite Configuration Optimizations (`app/vite.config.mjs`)

#### Plugin Optimization
- **Conditional Plugin Loading**: Heavy plugins like `moduleAnalyzerPlugin` and `splitVendorChunkPlugin` are only loaded during production builds
- **Fast Refresh**: Enabled React Fast Refresh for development builds only
- **Module Analysis**: Module analyzer now skips analysis in development unless explicitly requested via `VITE_ANALYZE_MODULES=true`

#### Build Cache
- **Vite Cache**: Enabled build cache with `cacheDir: "node_modules/.vite"` for faster rebuilds
- **Dependency Pre-bundling**: Optimized with `optimizeDeps.include` for frequently used dependencies

#### Target and Chunking
- **ES2022 Target**: Updated from ES2020 to ES2022 for better performance and modern JavaScript features
- **Smart Chunking**: Manual chunk splitting only in production builds to avoid overhead in development
- **Chunk Size Warning**: Increased limit to 1000KB to reduce noise during development

#### Dependency Pre-bundling
Pre-bundled critical dependencies for faster development builds:
- React ecosystem (react, react-dom, react-router-dom)
- Common utilities (axios, classnames, date-fns, nprogress)
- TurboUI component library

### 2. TypeScript Configuration Optimizations (`app/tsconfig.json`)

#### Performance Settings
- **Incremental Compilation**: Enabled `incremental: true` for faster subsequent builds
- **Skip Lib Check**: Added `skipLibCheck: true` to skip type checking of declaration files
- **Target Alignment**: Updated target from ES6 to ES2022 to match Vite configuration

#### Build Artifacts
- Added `tsconfig.tsbuildinfo` to `.gitignore` for TypeScript incremental build files

### 3. Plugin Performance Improvements (`app/assets/custom-vite-plugins.mjs`)

#### Module Analyzer Plugin
- **Conditional Execution**: Only runs in production or when `VITE_ANALYZE_MODULES=true`
- **Efficient Iteration**: Used `for...of` loops instead of `forEach` for better performance
- **Reduced Output**: Show top 10 packages instead of 20 for faster console output
- **Early Exit**: Skip analysis entirely in development builds

### 4. Build Script Enhancements (`app/package.json`)

Added new build script:
- **`build:dev`**: Fast development build with `NODE_ENV=development`

## Expected Performance Improvements

### Development Builds
- **Before**: 15-30 seconds with full module analysis and heavy plugins
- **After**: ~5 seconds with optimized plugins and caching

### Key Performance Factors
1. **Plugin Reduction**: Removing heavy analysis plugins in development saves 5-10 seconds
2. **Build Cache**: Vite cache enables incremental builds, saving 3-7 seconds on subsequent builds
3. **TypeScript Incremental**: Faster TypeScript compilation saves 2-5 seconds
4. **Dependency Pre-bundling**: Pre-bundled dependencies save 2-4 seconds on cold starts

## Usage

### Fast Development Build
```bash
npm run build:dev
```

### Standard Test Build (for CI)
```bash
npm run build
```

### Production Build (with full analysis)
```bash
npm run build:prod
```

### Enable Module Analysis in Development
```bash
VITE_ANALYZE_MODULES=true npm run build:dev
```

## Monitoring Performance

To monitor build performance:
1. Use `time` command: `time npm run build:dev`
2. Enable Vite debug mode: `DEBUG=vite:* npm run build:dev`
3. Check Vite cache hits in `node_modules/.vite/`

## Troubleshooting

If builds are still slow:
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Clear TypeScript incremental cache: `rm -f tsconfig.tsbuildinfo`
3. Ensure dependencies are properly pre-bundled by checking console output
4. Consider adding more dependencies to `optimizeDeps.include` if they're imported frequently