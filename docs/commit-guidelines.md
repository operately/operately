# Pull Request Guidelines

This document explains the pull request naming conventions used in the Operately project. These guidelines help maintain a clear project history and make it easier to understand what changes were introduced in each release.

## Pull Request Types

When creating pull requests, use one of the following prefixes in your PR title to categorize your changes:

### `feat:` - New Features

Use `feat:` for building new features and functionality. These commits introduce new capabilities that users can directly benefit from.

**Examples:**

- `feat: add goal progress tracking dashboard`
- `feat: implement team collaboration tools`
- `feat: add email notification preferences`

**When to use:**

- Adding new user-facing functionality
- Introducing new API endpoints
- Building new UI components or pages
- Adding new configuration options

### `fix:` - Bug Fixes and Improvements

Use `fix:` for improving existing functionality, fixing bugs, solving papercuts, and enhancing the user experience.

**Examples:**

- `fix: resolve login redirect issue`
- `fix: improve button hover states`
- `fix: correct spelling in notification messages`
- `fix: optimize database query performance`

**When to use:**

- Fixing bugs or errors
- Improving UI/UX elements
- Correcting typos or copy
- Performance optimizations
- Making existing features work better

### `chore:` - Maintenance and Infrastructure

Use `chore:` for code architecture changes, refactoring, CI improvements, and other maintenance tasks that users of the app would never notice.

**Examples:**

- `chore: refactor authentication module`
- `chore: update CI pipeline configuration`
- `chore: reorganize component file structure`
- `chore: upgrade dependencies`

**When to use:**

- Refactoring code without changing functionality
- Updating build tools or CI/CD pipelines
- Reorganizing file structures
- Updating dependencies
- Code cleanup and maintenance
- Developer tooling improvements

### `docs:` - Documentation

Use `docs:` for documentation changes and improvements.

**Examples:**

- `docs: update API documentation`
- `docs: add setup instructions for new developers`
- `docs: fix typos in README`

**When to use:**

- Adding or updating documentation
- Fixing documentation errors
- Improving code comments
- Creating or updating guides and tutorials

## Benefits of This System

This categorization system helps in several ways:

1. **Release Notes**: Based on these PR types, the release team can easily generate "what's new" summaries for each release
2. **Code Review**: Reviewers can quickly understand the scope and impact of changes
3. **Project Management**: Teams can track the balance between new features, bug fixes, and maintenance work
4. **User Communication**: Users can easily identify which changes affect them directly

## Creating Pull Requests

When creating pull requests, include the appropriate prefix in your PR title to help maintainers categorize and review your contribution effectively. Individual commits within the pull request don't need to follow this naming pattern - only the pull request title matters.

**Good examples:**

- `feat: implement user profile customization`
- `fix: resolve team invitation email delivery`
- `chore: migrate to new authentication library`
- `docs: add troubleshooting guide for common issues`

Following these guidelines helps maintain a clear and organized development process for the Operately project.
