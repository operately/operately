# Fix for Review Count Discrepancy Bug #3319

## Problem Description
The Review button in the top menu was showing a notification count (e.g., "1") but when users opened the review page, it showed "All caught up!" and "Nothing to review." This created a confusing user experience where the notification badge didn't match the actual content.

## Root Cause Analysis
The issue was caused by two different systems using different database queries and logic:

1. **GetAssignmentsCount** (for notification badge): Used separate database queries for each assignment type
2. **GetAssignments** (for review page): Used a unified `Assignments.Loader` with different filtering logic

The key discrepancy was that these systems had different approaches to:
- How assignments were loaded and filtered
- Which assignments were considered "mine" vs "reports" 
- The exact database queries and joins used

## Solution
Modified `GetAssignmentsCount` to use the exact same `Assignments.Loader` logic as `GetAssignments`. This ensures:

- Perfect consistency between count and displayed items
- Single source of truth for assignment loading logic
- No future divergence between the two systems

## Changes Made

### 1. Updated GetAssignmentsCount.ex
- Replaced custom counting queries with call to `Assignments.Loader.load()`
- Count only "mine" assignments (same as what's displayed on review page)  
- Added proper alias for cleaner code

### 2. Added Comprehensive Test Suite
- Created `ReviewCountConsistencyTest` with multiple test scenarios
- Tests empty state, mixed assignment types, and edge cases
- Validates that count always equals assignment list length

## Code Changes

**Before:**
```elixir
defp load_assignments_count(person) do
  count_due_projects(person)
  |> count_due_goals(person)
  |> count_due_project_check_ins(person)
  |> count_due_goal_updates(person)
end
```

**After:**
```elixir
defp load_assignments_count(person, company) do
  # Use the same logic as GetAssignments to ensure consistency
  [mine: my_assignments, reports: _] = Loader.load(person, company)
  length(my_assignments)
end
```

## Benefits
1. **Consistency**: Count always matches displayed items
2. **Maintainability**: Single source of truth for assignment logic
3. **User Experience**: No more confusing notification badges
4. **Future-proof**: Changes to assignment logic automatically apply to both systems

## Testing
Added comprehensive test suite covering:
- Basic consistency checks
- Empty state scenarios  
- Mixed assignment types (projects, goals, check-ins, updates)
- Edge cases with different user roles (champion vs reviewer)

The tests validate that `GetAssignmentsCount` and `GetAssignments` always return consistent results.