# Operately Project Structure

This document provides an overview of the Operately project structure, focusing on the main directories, their interconnections, and the technologies used. This documentation is designed to help AI assistants better understand the codebase organization, technology stack, and development workflow.

## Project Overview

Operately is a collaborative work management platform built with a modern tech stack. The project is organized into several key directories:

- `app/` - The main application codebase (Elixir/Phoenix backend + React frontend)
- `design/` - Design system and prototypes (Astro-based)
- `turboui/` - Shared UI component library
- `docker/` - Docker configuration files
- `docs/` - Project documentation

## Directory Structure

### App Directory

The `app/` directory contains the main application code, which follows the Elixir/Phoenix framework structure with a React frontend.

#### Backend (Elixir/Phoenix)

- `lib/operately/` - Core business logic and domain models
- `lib/operately_web/` - Web-specific code (controllers, views, etc.)
- `lib/operately_email/` - Email notification modules using Swoosh
- `lib/turbo_connect/` - Custom JSON API implementation with TypeScript generation
- `config/` - Application configuration files
- `priv/repo/migrations/` - Database migrations

#### Frontend (React)

- `assets/js/` - React components, hooks, contexts, and pages
- `assets/css/` - CSS stylesheets
- `assets/images/` - Static image assets

#### Technologies Used

- **Backend**: Elixir, Phoenix Framework, PostgreSQL
- **Frontend**: React, TypeScript, TailwindCSS
- **API**: Custom JSON API (TurboConnect) with TypeScript code generation
- **Email**: Swoosh for email notifications
- **Testing**: Mix test for backend, Jest for frontend

### Design Directory

The `design/` directory contains the design system and prototypes, built with Astro.

- `src/components/` - Reusable UI components
- `src/pages/` - Design system documentation pages
- `src/layouts/` - Page layout templates
- `src/styles/` - Global styles and theme definitions

#### Technologies Used

- **Framework**: Astro
- **UI Components**: React
- **Styling**: TailwindCSS
- **Component Library**: Radix UI

#### Technologies Used

- **Framework**: React
- **TypeScript**: For type safety
- **Dependencies**: Shared with the main app

## Project Interconnections

### How Components Work Together

1. **App and TurboUI**: The main application imports and uses components from the TurboUI library. This is configured as a local dependency in the app's package.json: `"turboui": "file:../turboui"`.

2. **Design and App**: The design system serves as a prototype and reference for the main application UI. Components designed in the design directory are implemented in the main app using the same styling principles and patterns.

3. **Backend and Frontend**: The backend exposes a custom JSON API that the frontend consumes. The `turbo_connect` module generates TypeScript types from the API definitions, ensuring type safety between backend and frontend.

## Project Management

### Makefile

The project uses a comprehensive Makefile to manage development tasks. Key commands include:

- `make dev.build` - Set up the development environment
- `make dev.server` - Start the development server
- `make design.server` - Start the design system server
- `make dev.db.migrate` - Run database migrations
- `make test` - Run tests
- `make gen` - Generate code (pages, TypeScript API)

### Docker Configuration

The project uses Docker for development and deployment:

1. **Development Environment**:
   - `docker-compose.yml` - Defines services for development
   - `docker/dev/Dockerfile.dev` - Development container configuration

2. **Services**:
   - `app` - Main application container
   - `db` - PostgreSQL database
   - `s3mock` - S3 mock for local development

3. **Development Workflow**:
   - The `./devenv` script is used to interact with the Docker environment
   - Development is done inside the Docker container, ensuring consistency

## Getting Started

To set up the development environment:

1. Install prerequisites: Docker and Make
2. Run `make dev.build` to set up the environment
3. Run `make dev.server` to start the development server
4. Run `make design.server` to start the design system server

Refer to the [Development Environment Documentation](../dev-env.md) for more details.

## Technology Stack Summary

- **Backend**: Elixir, Phoenix, PostgreSQL
- **Frontend**: React, TypeScript, TailwindCSS
- **API**: Custom JSON API (TurboConnect) with TypeScript generation
- **Design System**: Astro, React, TailwindCSS
- **UI Components**: Custom TurboUI library + Radix UI
- **Development**: Docker, Make
- **Testing**: Mix test (backend), Jest (frontend)

This structure allows for a modular, maintainable codebase with clear separation of concerns between backend, frontend, and design components.