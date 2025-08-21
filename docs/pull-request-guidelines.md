# Pull Request Guidelines

This document explains the pull request naming conventions used in the Operately project. These guidelines help maintain a clear project history and make it easier to understand what changes were introduced in each release.

## Pull Request Types

When creating pull requests, use one of the following prefixes in your PR title to categorize your changes:

### `feat:` - New Features

Use `feat:` for building new features and functionality. These commits introduce new capabilities that users can directly benefit from.

**Examples:**

- `feat: Add goal progress tracking dashboard`
- `feat: Implement team collaboration tools`
- `feat: Add email notification preferences`

**When to use:**

- Adding new user-facing functionality
- Introducing new API endpoints
- Building new UI components or pages
- Adding new configuration options

### `fix:` - Bug Fixes and Improvements

Use `fix:` for improving existing functionality, fixing bugs, solving papercuts, and enhancing the user experience.

**Examples:**

- `fix: Resolve login redirect issue`
- `fix: Improve button hover states`
- `fix: Correct spelling in notification messages`
- `fix: Optimize database query performance`

**When to use:**

- Fixing bugs or errors
- Improving UI/UX elements
- Correcting typos or copy
- Performance optimizations
- Making existing features work better

### `chore:` - Maintenance and Infrastructure

Use `chore:` for code architecture changes, refactoring, CI improvements, and other maintenance tasks that users of the app would never notice.

**Examples:**

- `chore: Refactor authentication module`
- `chore: Update CI pipeline configuration`
- `chore: Reorganize component file structure`
- `chore: Upgrade dependencies`

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

- `docs: Update API documentation`
- `docs: Add setup instructions for new developers`
- `docs: Fix typos in README`

**When to use:**

- Adding or updating documentation
- Fixing documentation errors
- Improving code comments
- Creating or updating guides and tutorials

## Benefits of This System

This categorization system helps in several ways:

### Release Management

1. **Release Notes**: Based on these PR types, the release team can easily generate "what's new" summaries for each release. Features tagged with `feat:` become the highlights of what's new in Operately, while `fix:` items show improvements users will notice.
2. **Release Planning**: The team can quickly filter and prioritize which changes to include in upcoming releases based on their type and impact.

### Weekly Progress Tracking

3. **Weekly Stats**: The team can collect weekly statistics on development progress by counting PRs in each category, helping track the balance between building new features vs. improving existing functionality vs. maintenance work.
4. **Team Velocity**: Tracking `feat:` PRs helps measure feature delivery velocity, while `fix:` PRs show maintenance and improvement efforts.

### Development Workflow

5. **Code Review**: Reviewers can quickly understand the scope and impact of changes before diving into the code.
6. **Project Management**: Teams can track the balance between new features, bug fixes, and maintenance work over time.
7. **User Communication**: Users can easily identify which changes affect them directly when reading release notes.

## Creating Pull Requests

When creating pull requests, include the appropriate prefix in your PR title to help maintainers categorize and review your contribution effectively. Individual commits within the pull request don't need to follow this naming pattern - only the pull request title matters.

**Good examples:**

- `feat: Implement user profile customization`
- `fix: Resolve team invitation email delivery`
- `chore: Migrate to new authentication library`
- `docs: Add troubleshooting guide for common issues`

**For Work-In-Progress (WIP) pull requests, place [WIP] after the prefix:**

- `feat: [WIP] Implement user profile customization`
- `fix: [WIP] Resolve team invitation email delivery`
- `chore: [WIP] Migrate to new authentication library`
- `docs: [WIP] Add troubleshooting guide for common issues`

**Note:** Avoid placing [WIP] before the prefix (e.g., `[WIP] feat: ...`) as this will cause CI validation to fail.

Following these guidelines helps maintain a clear and organized development process for the Operately project.
