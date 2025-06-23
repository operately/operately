# TurboUI Development Guide

This document captures the architecture principles, patterns, and workflow for developing components in the turboui library - a React-based component system for Operately's work management software, featuring goal tracking, project management, task management, and team communication.

## Architecture Principles

### Component Design

- **Self-contained components**: Components should manage their own state when possible, using callbacks to notify parents of changes
- **Generic callbacks**: Prefer generic update callbacks (e.g., `onTaskUpdate`, `onMilestoneUpdate`) over specific ones (e.g., `onAssigneeChange`, `onDueDateChange`)
- **No mock data in components**: Mock data belongs in Storybook stories, not in component files
- **Backward compatibility**: Maintain compatibility where possible when refactoring

### State Management

- **Local state with parent notification**: Components maintain local state and notify parents via callbacks
- **Callback patterns**: Use `(id: string, updates: Partial<Type>) => void` for update callbacks

### TypeScript

- **Strict mode**: Ensure all TypeScript types are properly defined with no implicit any
- **Shared types**: Use centralized type files to avoid circular dependencies
- **Interface consistency**: Match callback signatures across similar components
- **Prefer named exports over default exports**: Vite and other bundlers have a harder time working with default exports (slower compile speed, flaky name lookup in IDEs)

## Development Workflow

### Setup

1. **Storybook development**: Components are developed and tested in Storybook
2. **TypeScript checking**: Run `make turboui.build && make turboui.test` regularly
3. **Component stories**: Create comprehensive stories showing all component states

### Tips

- **Ask, do not assume**: If requirements are not 100% clear do not jump into implementation with assumptions but ask for clarifications and present options if possible.

### File Organization

```
src/
├── ComponentName/
│   ├── index.tsx              # Main component
│   ├── index.stories.tsx      # Storybook stories
│   └── types.ts              # Component-specific types (if needed)
├── TaskBoard/
│   ├── components/           # TaskBoard-specific components
│   ├── stories/             # TaskBoard stories
│   ├── tests/               # Mock data and utilities
│   ├── utils/               # Shared utilities
│   └── types.ts             # Shared TaskBoard types
```

### Story Development

- **State management**: Use React state in story decorators for interactivity
- **Comprehensive examples**: Show empty states, error states, loading states
- **Interactive callbacks**: Implement all callbacks with console logging
- **Mock data**: Create realistic test data that demonstrates all features

## Testing & Quality

### TypeScript Checks

Always run before committing:

```bash
make turboui.build && make turboui.test
```

### Common Issues

- **Type mismatches**: `Date | null` vs `Date | undefined` - use `value || undefined`
- **Missing callbacks**: Ensure interactive components receive appropriate update callbacks
- **Prop drilling**: Use callback props to pass updates up the component tree
- **State synchronization**: Keep local state in sync with parent state via useEffect

## Design System

### Visual Consistency

- **Icons**: Use Tabler icons consistently, hide in list contexts to reduce clutter
- **Colors**: Use existing color classes (content-subtle, content-error, etc.) defined in tailwind config and outlined in turboui/src/Colors
- **Spacing**: Use consistent gap and padding patterns

### Interaction Patterns

- **Hover reveal**: Use opacity transitions for discoverable actions
- **Loading states**: Show appropriate feedback during async operations
- **Error states**: Clear error messaging and recovery paths
- **Empty states**: Helpful guidance for first-time users

## Design System Principles

### Visual Cohesion and Grouping

- **Container-based thinking**: When controls feel disconnected, wrap them in a unified container with consistent backgrounds, borders, and spacing
- **Visual hierarchy through grouping**: Related functionality should be visually grouped together (e.g., header controls for a data section)
- **Prevent layout drift**: Use containers to maintain visual structure even in empty states
- **Follow established patterns**: Look to existing components for consistent container and header patterns

### Empty State Design

- **Always design for empty states**: Every list, collection, or data display needs a thoughtful empty state
- **Actionable empty states**: Include clear instructions and prominent CTAs that guide users to the next step
- **Maintain visual structure**: Empty states should preserve the same visual container as populated states
- **Guide user intent**: Make the primary action obvious and accessible in empty states

### Component Layout Principles

- **Inline vs. stacked elements**: Related controls that act on the same data should flow together horizontally when possible
- **Breathing room matters**: Use consistent spacing to prevent cramped layouts - increase spacing values when elements feel tight
- **Primary action prominence**: Make the most important action visually prominent and contextually placed
- **Visual weight balance**: Avoid layouts with unbalanced white space or heavy clustering in one area

### Consistency Guidelines

- **Match existing patterns**: When designing new sections, reference similar existing components for typography, spacing, and interaction patterns
- **Standardize component variants**: Use consistent button types and component choices across similar use cases
- **Typography consistency**: Match header sizes and styles across similar sections throughout the application
- **Use standard components**: Always use design system components (Link variants, Button variants) instead of custom implementations

### Interactive Design

- **Contextual placement**: Place actions near the content they affect rather than in distant headers or sidebars
- **State management**: Ensure interactive elements actually update state in stories and implementations for realistic behavior
- **Progressive disclosure**: Show advanced controls contextually within their relevant sections rather than globally
- **Clear affordances**: Make interactive elements obviously clickable and provide clear feedback on state changes

## Future Considerations

### Potential Extensions

- **Keyboard shortcuts**: Add hotkeys for common actions
- **Bulk operations**: Multi-select and bulk edit functionality
- **Advanced filtering**: Date ranges, assignee filters, status filters
- **Real-time updates**: Live collaboration features
- **Mobile optimization**: Touch-friendly interactions
- **Accessibility**: Screen reader support, keyboard navigation

### Architecture Evolution

- **Context providers**: Consider React Context for deeply nested prop passing
- **State management**: Evaluate need for more sophisticated state management
- **Performance**: Implement React.memo and useMemo for large datasets
- **Testing**: Add unit tests for complex component logic
