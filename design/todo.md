# JavaScript to TypeScript Migration Checklist

## Milestone 1: TypeScript Environment Setup

- [x] ~~Verify existing TypeScript configuration (tsconfig.json)~~
- [x] Install TypeScript-related dependencies:
  ```bash
  npm install --save-dev typescript @types/react @types/react-dom
  ```
- [x] Review and update tsconfig.json if needed:
  - [x] Ensure jsx options are configured correctly
  - [x] Check that path mappings are set up properly
  - [x] Verify that module resolution is configured appropriately
- [x] Create or update .gitignore to exclude TypeScript build artifacts
- [x] Add TypeScript linting with ESLint:
  ```bash
  npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```
- [x] Create or update .eslintrc.js for TypeScript support
- [x] Configure Astro for TypeScript:
  - [x] Ensure React components in TypeScript are properly integrated
  - [x] Update any Astro-specific TypeScript configurations

## Milestone 2: Create Type Definitions

- [x] Create a types directory structure:
  ```
  src/
  └── types/
      ├── common.ts     # Shared types across the application
      ├── workmap.ts    # WorkMap-specific types
      ├── button.ts     # Button-specific types
      └── ...           # Other domain-specific type files
  ```
- [x] Define common types used throughout the application:
  - [x] Create GoalStatus enum/type with all status values:
    ```typescript
    export type GoalStatus =
      | "on_track"
      | "completed"
      | "achieved"
      | "partial"
      | "paused"
      | "dropped"
      | "caution"
      | "issue"
      | "missed"
      | "pending";
    ```
  - [x] Define component prop interfaces for each component
  - [x] Create types for common data structures and state
- [x] If using external APIs, define interfaces for API responses
- [x] Define utility types for common patterns (e.g., Partial, Pick, etc.)
- [x] Create theme types to enforce consistent styling
- [x] Define event handler types for consistent event handling

## Milestone 3: Incremental Implementation

### Phase 1: Convert Utilities and Simple Components

- [x] Convert utility functions:
  - [ ] Create a spreadsheet to track conversion status
  - [x] Convert src/components/Button/calcClassNames.jsx → calcClassNames.ts:
    - [x] Add proper type definitions for parameters and return values
    - [x] Ensure type safety for all function calls
  - [x] Convert other utility functions (helpers, formatters, etc.)
- [x] Convert small, self-contained components:
  - [x] Convert src/components/WorkMap/Icons.jsx → Icons.tsx
  - [x] Convert src/components/WorkMap/StatusBadge.jsx → StatusBadge.tsx
  - [x] Convert src/components/WorkMap/ProgressBar.jsx → ProgressBar.tsx
  - [ ] Convert other simple components with minimal dependencies
- [x] Update imports and cleanup:
  - [x] Update imports in all pages to use TypeScript versions
  - [x] Verify component functionality in the browser
  - [x] Delete original JavaScript files once verified

### Phase 2: Convert Medium-Complexity Components

- [x] Identify components with moderate complexity:
  - [x] Convert src/components/WorkMap/QuickAddRow.jsx → QuickAddRow.tsx
  - [x] Convert src/components/WorkMap/SelectableTableRow.jsx → SelectableTableRow.tsx
  - [x] Convert src/components/WorkMap/HoverQuickEntryWidget.jsx → HoverQuickEntryWidget.tsx
- [x] Test each component after conversion:
  - [x] Ensure all props are properly typed
  - [x] Verify event handlers have proper type signatures
  - [x] Check that component renders correctly
- [x] Update imports and cleanup:
  - [x] Update imports in all pages to use TypeScript versions
  - [x] Verify component functionality in the browser
  - [x] Delete original JavaScript files once verified

### Phase 3: Convert Complex Components

- [x] Convert complex components with many dependencies:
  - [x] Convert src/components/WorkMap/TableRow.jsx → TableRow.tsx
  - [x] Convert src/components/WorkMap/WorkMapTable.jsx → WorkMapTable.tsx
  - [x] Convert src/components/WorkMap/WorkMapTabs.jsx → WorkMapTabs.tsx
- [x] Address circular dependencies if they arise:
  - [x] Use interface merging or module augmentation if needed
  - [x] Consider refactoring to improve code organization
- [x] Test thoroughly after each component conversion
- [x] Update imports and cleanup:
  - [x] Update imports in all pages to use TypeScript versions
  - [x] Verify component functionality in the browser
  - [x] Delete original JavaScript files once verified

### Phase 4: Astro Pages and Layouts

- [x] Convert Astro-specific files:
  - [x] Update any .astro files to properly type-check imported components
  - [x] Ensure all component props are properly typed in Astro templates
  - [x] Update any Astro API integrations to use TypeScript
- [x] Final cleanup:
  - [x] Ensure all imports use TypeScript versions
  - [x] Verify application functionality in the browser
  - [x] Remove any remaining JavaScript files that have TypeScript equivalents

## Testing and Quality Assurance

- [x] Implement comprehensive testing strategy:
  - [x] Run TypeScript compiler after each file conversion
  - [x] Fix any type errors before moving to the next file
  - [x] Ensure no runtime errors are introduced
- [x] Update build process if needed
- [x] Document any patterns or workarounds used during migration
- [x] Create type-checking scripts for pre-commit hooks

## Final Verification

- [ ] Run the complete application to verify all features work:
  - [ ] Test all routes and pages
  - [ ] Verify all interactive elements function correctly
  - [ ] Check dark mode and responsive design
- [ ] Run the TypeScript compiler with strict mode enabled:
  ```bash
  npx tsc --noEmit
  ```
- [ ] Resolve any remaining type errors or warnings
- [ ] Update documentation to reflect TypeScript conventions
- [ ] Create a style guide for TypeScript best practices in the project

## Post-Migration Improvements

- [ ] Refine types to be more specific (replacing any with concrete types)
- [ ] Add stronger type guards where appropriate
- [ ] Consider implementing branded types for more type safety
- [ ] Explore advanced TypeScript features where beneficial:
  - [ ] Discriminated unions
  - [ ] Utility types
  - [ ] Conditional types
- [ ] Optimize build performance for TypeScript compilation
- [ ] Remove any redundant type assertions or workarounds
