# TypeScript Migration Guide

This document outlines the patterns, practices, and workarounds used during the migration from JavaScript to TypeScript in the Operately BPRD codebase.

## Migration Process

The migration was conducted in phases:

1. **Basic Setup**: Setting up TypeScript configuration and dependencies
2. **Simple Components**: Converting simple stateless components 
3. **Medium-Complexity Components**: Converting components with moderate complexity
4. **Complex Components**: Converting components with many dependencies
5. **Astro Integration**: Ensuring proper TypeScript integration with Astro

## Common Patterns Used

### 1. Type Definitions

- Created dedicated type definition files in `src/types` directory
- Used interfaces for complex object structures
- Used type aliases for simpler/union types
- Added JSDoc comments to explain purpose of types

### 2. Component Props

- Defined explicit interfaces for component props
- Made optional props nullable with `?` syntax
- Used consistent naming conventions (ComponentProps, ComponentNameProps)

### 3. Event Handlers

- Properly typed event handlers using React types
- Example: `onChange: (event: React.ChangeEvent<HTMLInputElement>) => void`
- Used function overloads for complex handlers where necessary

### 4. State Management

- Properly typed hooks like useState, useReducer
- Example: `const [state, setState] = useState<StateType>(initialValue)`

### 5. Work Map Specific Types

- Defined specialized interfaces for work items
- Implemented the three-state goal completion model:
  - **Achieved** (green) - Goal fully accomplished
  - **Partial** (amber/yellow) - Goal partially accomplished
  - **Missed** (red) - Goal not accomplished
- Ensured backward compatibility with legacy status values like 'completed' and 'failed'

## Workarounds Used

### 1. Optional Properties

- Made certain properties optional to accommodate existing data patterns
- Example: Made `owner.initials` optional to avoid strict TypeScript errors

### 2. Import Extensions

- Added explicit `.tsx` extensions in Astro imports
- Example: `import Component from '../components/Component.tsx'`

### 3. Type Assertions

- Used type assertions sparingly where TypeScript couldn't infer types correctly
- Example: `(event as React.MouseEvent<HTMLButtonElement>)`

## Remaining Issues

Several components still need conversion to TypeScript:

1. Button components
2. Callout components
3. Menu components
4. Tooltip components

These components show TypeScript errors when running `tsc --noEmit`.

## Best Practices Going Forward

1. Always define explicit return types for functions
2. Use interfaces for complex objects and type aliases for simpler types
3. Prefer union types over `any` where possible
4. Use descriptive type names that convey the purpose of the type
5. Keep type definitions organized in dedicated files
6. Add proper JSDoc comments to explain complex types
