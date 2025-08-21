# Operately Development Instructions

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Operately is an Elixir Phoenix web application with a React TypeScript frontend. It uses Docker for development environment management and has comprehensive Make-based build automation.

## Pull Request Naming Convention

**CRITICAL**: When creating pull requests, ALWAYS use one of these prefixes in the PR title:

- **feat:** - For new features and functionality that users can directly benefit from
- **fix:** - For bug fixes, improvements to existing functionality, and UX enhancements  
- **chore:** - For maintenance, refactoring, CI improvements, and infrastructure changes
- **docs:** - For documentation changes and improvements

**Examples of correct PR titles:**
- `feat: Add goal progress tracking dashboard`
- `fix: Resolve login redirect issue`
- `chore: Update CI pipeline configuration`  
- `docs: Add troubleshooting guide for common issues`

The CI will fail with `make test.pr.name` if PR titles don't follow this format. See `docs/pull-request-guidelines.md` for detailed guidelines.

## Working Effectively

**🚨 CRITICAL PRE-SUBMISSION REQUIREMENT 🚨**

**BEFORE submitting ANY code changes, you MUST run and ensure these commands pass:**
```bash
make test.tsc.lint           # TypeScript compilation - MUST PASS
make test.js.fmt.check       # JavaScript/TypeScript formatting - MUST PASS
make test.elixir.warnings    # Elixir warnings check - MUST PASS
```

**Failure to run these commands will result in CI failures. Do not skip this step.**

---

### Bootstrap and Build the Repository
```bash
# Prerequisites: Docker 20.0+ with compose plugin, Make 4.0+
docker --version    # Should show Docker 20.0+
docker compose version  # Should show Docker Compose v2.0+
make --version     # Should show GNU Make 4.0+

# Full development environment setup
make dev.build     # NEVER CANCEL: Takes 15-25 minutes, includes Docker pulls, Elixir deps, npm install, turboui build, database setup. Set timeout to 40+ minutes.
```

**CRITICAL TIMING**: The `make dev.build` command performs the following steps in sequence:
- Docker container setup and pulls: 2-5 minutes
- Elixir dependencies (mix deps.get): 3-8 minutes  
- Node.js dependencies (npm install): 5-10 minutes
- TurboUI component library build: 2-5 minutes
- Database creation and migrations: 1-3 minutes

### Run the Application
```bash
make dev.server    # Starts Phoenix server at http://localhost:4000
# The server includes live reload and should start within 30-60 seconds
```

### Test Commands
```bash
# Run all tests - NEVER CANCEL: Takes 20-35 minutes total. Set timeout to 45+ minutes.
make test.all      # Runs both Elixir tests and JavaScript tests

# Individual test suites
make test.mix      # NEVER CANCEL: Elixir tests take 10-20 minutes. Set timeout to 30+ minutes.
make test.npm      # JavaScript/TypeScript tests take 3-8 minutes. Set timeout to 15+ minutes.

# Feature tests (end-to-end)
make test.mix.features INDEX=1 TOTAL=1  # NEVER CANCEL: Takes 15-25 minutes. Set timeout to 35+ minutes.

# Unit tests only
make test.mix.unit  # NEVER CANCEL: Takes 8-15 minutes. Set timeout to 25+ minutes.

# Enterprise edition tests
make test.ee       # NEVER CANCEL: Takes 5-10 minutes. Set timeout to 20+ minutes.
```

### Code Quality and Formatting
```bash
# ALWAYS run these before committing - they are required for CI to pass
make js.fmt.fix              # Fixes JavaScript/TypeScript formatting
make test.js.fmt.check       # Validates JavaScript/TypeScript formatting
make test.elixir.warnings    # Validates Elixir code has no warnings
make test.tsc.lint           # TypeScript compilation check - CRITICAL: MUST PASS before any code submission
make test.license.check      # License compliance check
make test.pr.name           # Pull request naming validation
```

**CRITICAL TYPESCRIPT REQUIREMENT**: 
- `make test.tsc.lint` **MUST** be run and **MUST PASS** before submitting any code changes
- This command performs TypeScript compilation checks and catches type errors
- **NEVER** submit code that fails TypeScript linting - it will cause CI failures
- If `make test.tsc.lint` fails, fix all TypeScript errors before proceeding

## Development Workflow

### Key Components
- **Backend**: Elixir Phoenix app in `/app` directory
- **Frontend**: React TypeScript in `/app/assets/js`
- **Component Library**: TurboUI in `/turboui` directory  
- **Development Environment**: Docker-based via `./devenv` script
- **Database**: PostgreSQL (runs in Docker container)

### Important Files and Directories
```bash
# Repository structure (validated)
/app/                    # Main Phoenix application
  /lib/operately/        # Core business logic and models
  /lib/operately_web/    # Web interface (controllers, GraphQL schemas)
  /assets/js/           # React TypeScript frontend
    /pages/             # Page components (route-level)
    /components/        # Reusable UI components  
    /features/          # Feature-specific components
    /models/            # Data fetching logic
    /api/              # Generated TypeScript API bindings
    /__tests__/        # JavaScript test files
  /test/                # Elixir tests
    /features/         # Feature test files
    /support/          # Test support modules
  /config/             # Application configuration
  /priv/repo/          # Database migrations and seeds
  mix.exs               # Elixir dependencies and config
  package.json          # Node.js dependencies
  vite.config.mjs       # Vite build configuration
  tsconfig.json         # TypeScript configuration

/turboui/               # React component library
  /src/                 # Component source files
  package.json          # Component library dependencies
  tsconfig.json         # TypeScript config for components
  
/docs/                  # Documentation
  dev-env.md           # Development setup guide
  architecture.md      # System architecture overview
  
/scripts/               # Build and utility scripts
  run_unit_tests.js    # Unit test runner
  run_feature_tests.js # Feature test runner (with parallelization)
  prettier-check.sh    # Code formatting validation
  license-check.sh     # License compliance check
  
Makefile                # Build automation (60+ targets)
./devenv                # Docker development wrapper script
docker-compose.yml      # Development services (app, database, s3mock)
.env                    # Environment variables (auto-generated)
```

### Creating New Features
```bash
# Generate a new page
make gen.page NAME=MyNewPage

# Generate database migration  
make gen.migration NAME=add_new_table

# Generate activity types (for audit trail)
make gen.activity

# Regenerate TypeScript API from GraphQL schemas
make gen
```

### Database Operations
```bash
# Development database
make dev.db.create      # Create development database
make dev.db.migrate     # Run pending migrations  
make dev.db.reset       # Drop, recreate, and migrate database
make dev.db.seed        # Load seed data

# Test database
make test.db.create     # Create test database
make test.db.migrate    # Migrate test database
make test.db.reset      # Reset test database
```

## Validation and Testing Scenarios

### ALWAYS Test These Scenarios After Making Changes
1. **Application Startup**: Run `make dev.server` and verify the server starts without errors at http://localhost:4000
2. **Build Validation**: Run `make test.all` to ensure all tests pass
3. **Code Formatting**: Run `make js.fmt.fix` and `make test.js.fmt.check` to ensure proper formatting
4. **TypeScript Compilation**: Run `make test.tsc.lint` to catch TypeScript errors - **THIS IS MANDATORY**

**CRITICAL**: Steps 3 and 4 are **REQUIRED** before any code submission. TypeScript linting failures will block CI.

### Manual Testing Requirements
After making code changes, ALWAYS:
1. Start the development server with `make dev.server`
2. Navigate to http://localhost:4000 in browser
3. Test the specific functionality you modified
4. Verify no JavaScript console errors appear
5. Check that the application loads and functions properly
6. **MANDATORY**: Run `make test.tsc.lint` and ensure it passes - fix any TypeScript errors before proceeding

## Common Development Tasks

### Working with Dependencies
```bash
# Elixir dependencies
./devenv bash -c "cd app && mix deps.get"        # Install Elixir dependencies
./devenv bash -c "cd app && mix deps.clean --unused"  # Clean unused dependencies

# Node.js dependencies  
./devenv bash -c "cd app && npm install"         # Install Node.js dependencies
./devenv bash -c "cd turboui && npm install"     # Install TurboUI dependencies
```

### Navigation and Code Exploration
```bash
# Key directories to frequently inspect:
ls app/lib/operately/           # Core business logic modules
ls app/lib/operately_web/       # Web layer (controllers, GraphQL)
ls app/assets/js/pages/         # React page components
ls app/assets/js/components/    # Reusable UI components
ls app/assets/js/features/      # Feature-specific components
ls app/test/                    # Elixir test files
ls turboui/src/                 # Component library source
```

### Working with TurboUI Component Library
```bash
make turboui.build      # NEVER CANCEL: Build component library, takes 3-8 minutes. Set timeout to 15+ minutes.
make turboui.test       # Run component library tests, takes 2-5 minutes. Set timeout to 10+ minutes.
make turboui.storybook  # Start Storybook at http://localhost:4020
```

### Docker Environment Management
```bash
./devenv up             # Start all containers (database, app, s3mock)
./devenv down           # Stop and remove all containers  
./devenv shell          # Open bash shell in app container
./devenv bash -c "command"  # Run command in app container
```

## Architecture Overview

### Technology Stack
- **Backend**: Elixir 1.17+ with Phoenix Framework
- **Frontend**: React 18+ with TypeScript
- **Database**: PostgreSQL 14+
- **GraphQL**: Absinthe (backend) + Apollo Client (frontend)
- **Background Jobs**: Oban
- **Email**: Bamboo
- **File Storage**: S3-compatible storage

### Data Flow Pattern
1. **Operations Pattern**: All data changes go through `Operately.Operations` modules
2. **Activity Tracking**: Every operation creates an activity record for audit trail
3. **GraphQL API**: Frontend communicates with backend via GraphQL queries/mutations
4. **Page-Level Data Loading**: Each page has a `loader` function for data fetching

### Key Development Patterns
- Pages are in `app/assets/js/pages/` with both `Page` component and `loader` function
- Business logic lives in `app/lib/operately/` context modules
- GraphQL schemas are in `app/lib/operately_web/graphql/`
- All data mutations must go through Operations for consistency
- UI components should be reusable and not contain business logic

## Troubleshooting

### Common Issues
- **Network connectivity errors during build**: The Docker containers may not have internet access in some environments. If `make dev.build` fails with network errors, this is expected in restricted environments.
- **Permission errors**: Use `./devenv` script instead of direct `docker compose` commands
- **Database connection errors**: Ensure `make dev.up` has completed and database container is running
- **Port conflicts**: Default ports are 4000 (dev server), 4002 (test server), 4005 (vite), 4020 (storybook)

### Build Failures
If builds fail:
1. Check that Docker and Make are properly installed
2. Ensure Docker daemon is running
3. Try `make dev.teardown` followed by `make dev.build` for clean rebuild
4. Check available disk space (builds require ~2GB free space)
5. Network connectivity: If `make dev.build` fails with hex.pm or npm registry errors, this indicates network restrictions that prevent dependency installation

### TypeScript Linting Issues
If `make test.tsc.lint` fails:
1. **Read the error output carefully** - TypeScript errors are usually very specific
2. **Fix each TypeScript error** - do not ignore or work around them
3. **Common issues**:
   - Missing type annotations
   - Incorrect type usage
   - Import/export problems
   - Unused variables or imports
4. **Re-run `make test.tsc.lint`** after fixes until it passes
5. **Never submit code** with TypeScript linting failures

### Expected Command Outputs
```bash
# These commands should work offline and can be used to validate environment:
docker --version                    # Should show Docker 28.0+ 
docker compose version             # Should show Docker Compose v2.0+
make --version                     # Should show GNU Make 4.0+
./devenv bash -c "mix --version"   # Should show Mix 1.17+ (Elixir)
./devenv bash -c "node --version"  # Should show Node 20.0+
./devenv bash -c "npm --version"   # Should show npm 10.0+
```

## CI/CD Integration

The project uses SemaphoreCI for continuous integration. Key validation steps match local commands:
- `make test.pr.name` - Pull request naming validation
- `make test.license.check` - License compliance
- `make test.js.dead.code` - Dead code detection  
- `make test.tsc.lint` - **TypeScript validation (CRITICAL - MUST PASS)**
- `make test.elixir.warnings` - Elixir compiler warnings
- `make test.mix.unit` - Unit test suite
- `make test.mix.features` - Feature test suite (runs in parallel)
- `make test.npm` - JavaScript test suite

**⚠️ IMPORTANT**: The `make test.tsc.lint` step is frequently the cause of CI failures. Always run this locally and fix any TypeScript errors before submitting code.

**CRITICAL REMINDERS**:
- **NEVER CANCEL long-running builds or tests** - they may take 45+ minutes
- **ALWAYS set appropriate timeouts** (40+ minutes for builds, 45+ minutes for full test suites) 
- **ALWAYS run formatting and linting** before committing changes
- **MANDATORY: Run `make test.tsc.lint` before ANY code submission** - TypeScript errors will fail CI
- **ALWAYS test manual scenarios** after making changes
- The development environment requires Docker and significant time for initial setup

## Quick Reference Commands

### Most Frequently Used Commands
```bash
# Daily development workflow
make dev.server                    # Start development server (most common)
make test.all                      # Run complete test suite 
make js.fmt.fix                    # Fix code formatting issues
./devenv shell                     # Open shell in development container

# Code generation (saves significant time)
make gen.page NAME=NewPageName     # Generate new page with boilerplate
make gen.migration NAME=desc       # Generate database migration
make gen                          # Regenerate TypeScript API from GraphQL

# Quick validation before commits
make test.js.fmt.check            # Validate JavaScript formatting
make test.tsc.lint                # Validate TypeScript compilation - REQUIRED BEFORE ANY COMMIT
make test.elixir.warnings         # Check for Elixir warnings
```

### Performance Expectations
| Command | Expected Time | Timeout Setting |
|---------|---------------|----------------|
| `make dev.build` | 15-25 minutes | 40+ minutes |
| `make dev.server` | 30-60 seconds | 5 minutes |
| `make test.all` | 20-35 minutes | 45+ minutes |
| `make test.mix` | 10-20 minutes | 30+ minutes |
| `make test.npm` | 3-8 minutes | 15+ minutes |
| `make turboui.build` | 3-8 minutes | 15+ minutes |
| `make gen` | 30-90 seconds | 5 minutes |