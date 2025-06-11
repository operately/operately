# TaskPage Implementation Checklist

## Phase 1: Core Page Structure (Updated Priority)

### StatusSelector Component ✅ COMPLETED

- [x] ~~Create `src/StatusSelector/` directory~~ (Kept within TaskBoard components per discussion)
- [x] Refactor existing `src/TaskBoard/components/StatusSelector.tsx`
  - [x] Define clean StatusSelectorProps interface (status, onChange, size, readonly, showFullBadge)
  - [x] Implement status dropdown/select component
  - [x] Add color-coded status badges
  - [x] Support size variants (sm, md, lg)
  - [x] Add readonly mode
  - [x] Handle keyboard navigation (existing functionality preserved)
  - [x] Add proper accessibility attributes (existing functionality preserved)
- [x] Create `src/TaskBoard/stories/StatusSelector.stories.tsx`
  - [x] Default story with all status options
  - [x] Different size variants
  - [x] Readonly state
  - [x] Interactive callback demonstration
  - [x] Comprehensive examples (InListContext story)
- [x] Extract status logic from TaskItem
  - [x] Update TaskItem to use refactored StatusSelector
  - [x] Replace task object prop with individual status prop
  - [x] Verify TaskItem still works in TaskBoard stories
  - [x] Test drag & drop still functions
  - [x] Run TypeScript checks
- [x] Update TaskItem integration (uses new props: status, onChange, size="md", readonly)

## Phase 2: Main TaskPage Component

### TaskPage Structure (Following GoalPage Pattern) ✅ COMPLETED

- [x] Create `src/TaskPage/` directory (top-level like GoalPage)
- [x] Create `src/TaskPage/index.tsx` main component
  - [x] Define TaskPage.Props interface (following GoalPage namespace pattern)
  - [x] Define TaskPage.State interface with hooks
  - [x] Create useTaskPageState hook
  - [x] Implement main TaskPage component with PageNew
  - [x] Handle prop drilling to child components
- [x] Create `src/TaskPage/PageHeader.tsx`
  - [x] Breadcrumb navigation (Space > Project > [Milestone])
  - [x] Status badge + editable title (using StatusSelector)
  - [x] Page options integration
- [x] Create `src/TaskPage/Overview.tsx`
  - [x] Main content area with description editing
  - [x] Comments/activity placeholder
- [x] Create `src/TaskPage/Sidebar.tsx`
  - [x] Due date, assignees, milestone sections
  - [x] Subscription toggle with messaging
  - [x] Created by metadata display
- [x] Create `src/TaskPage/PageOptions.tsx`
  - [x] Copy URL, Delete, Duplicate, Archive actions
- [x] Add mobile responsive layout following GoalPage pattern
  - [x] PageNew handles responsive layout
  - [x] Flex layout with sidebar stacking on mobile

- [x] Create `src/TaskPage/index.stories.tsx`
  - [x] Follow GoalPage stories pattern
  - [x] Set up as Pages/TaskPage in Storybook
  - [x] Create comprehensive mock data
  - [x] Implement interactive callbacks with state
  - [x] Test all states (Default, Minimal, NoProject, NoMilestone, Completed, Overdue, LongContent, ReadOnly)

### Component Development Details ✅ COMPLETED

- [x] **PageHeader.tsx**: Editable title with internal state buffering
  - [x] Status badge + title on same line (using StatusSelector)
  - [x] Breadcrumb above title with dynamic navigation
  - [x] Follow GoalPage updateGoalName pattern for updateTaskName
  - [x] Handle validation, loading, error states (EditableText handles this)
  - [x] Keyboard shortcuts (Enter to save, Escape to cancel)

- [x] **Overview.tsx**: Description editing following GoalPage pattern  
  - [x] Use RichEditor component like GoalPage Description.tsx
  - [x] Implement internal state buffering for rich content
  - [x] Follow GoalPage updateDescription pattern
  - [x] Add comments/activity placeholder section

- [x] **Sidebar.tsx**: Task metadata and actions
  - [x] Due date section using DateDisplayField
  - [x] Assignees section using PersonField  
  - [x] Milestone section (if applicable)
  - [x] Subscription toggle with messaging
  - [x] Created by metadata with avatar and date
  - [x] Follow GoalPage Sidebar responsive patterns

- [x] **PageOptions.tsx**: Action menu integration
  - [x] Copy URL, Delete, Duplicate, Archive actions
  - [x] Follow GoalPage pageOptions pattern
  - [x] Integrate with PageNew options prop

## Phase 3: Sidebar Components

### TaskPageActions Component

- [ ] Create `src/TaskBoard/components/TaskPageActions.tsx`
  - [ ] Define TaskPageActionsProps interface
  - [ ] Implement action menu component
  - [ ] Add Copy URL action
  - [ ] Add Delete action (with confirmation)
  - [ ] Add Duplicate action (optional prop)
  - [ ] Add Archive action (optional prop)
  - [ ] Handle loading states for actions
  - [ ] Add disabled states
  - [ ] Implement three-dot menu for mobile
- [ ] Create TaskPageActions stories
  - [ ] Default desktop layout
  - [ ] Mobile collapsed menu
  - [ ] Loading states
  - [ ] Different action combinations
  - [ ] Confirmation dialogs

### TaskPageSidebar Component

- [ ] Create `src/TaskBoard/components/TaskPageSidebar.tsx`
  - [ ] Define TaskPageSidebarProps interface
  - [ ] Implement desktop sidebar layout
  - [ ] Implement mobile inline layout
  - [ ] Add Due Date section using DateDisplayField
  - [ ] Add Assignees section using PersonField
  - [ ] Add Milestone section
  - [ ] Add Notifications toggle section
  - [ ] Add responsive breakpoint handling
  - [ ] Style subscription messaging
- [ ] Create TaskPageSidebar stories
  - [ ] Desktop sidebar story
  - [ ] Mobile inline story
  - [ ] Empty states (no due date, no assignees)
  - [ ] Subscription states (subscribed/unsubscribed)
  - [ ] Different milestone states

## Phase 4: Integration & Polish

### Metadata Display

- [ ] Add creation date display
  - [ ] Format using existing time utilities
  - [ ] Position in appropriate location
  - [ ] Style as secondary information
- [ ] Add creator information
  - [ ] Display creator name and avatar
  - [ ] Style as secondary information
  - [ ] Handle missing avatar gracefully

### Subscription Management

- [ ] Implement subscription toggle
  - [ ] Create toggle component or use existing
  - [ ] Add subscription status messaging
  - [ ] Handle loading states during toggle
  - [ ] Show appropriate microcopy
  - [ ] Handle error states

### Comments/Activity Placeholder

- [ ] Add placeholder section for comments
  - [ ] Create temporary placeholder component
  - [ ] Style to match expected final layout
  - [ ] Include placeholder text
  - [ ] Position correctly in layout

### Mobile Optimization

- [ ] Test and refine mobile layout
  - [ ] Verify content reordering works
  - [ ] Test touch interactions
  - [ ] Optimize spacing for mobile
  - [ ] Test on various screen sizes
  - [ ] Verify action menu works on mobile

## Phase 4: Stories & Documentation

### TaskPage Stories

- [ ] Create `src/TaskBoard/components/TaskPage.stories.tsx`
  - [ ] Set up story decorator with Page wrapper
  - [ ] Configure fullscreen layout
  - [ ] Add proper story metadata
- [ ] Implement Default story
  - [ ] Complete task with all fields populated
  - [ ] Working callbacks with console logging
  - [ ] Realistic mock data
- [ ] Implement MinimalTask story
  - [ ] Task with only required fields
  - [ ] No assignees, no due date, no milestone
  - [ ] Test empty states
- [ ] Implement NoProject story
  - [ ] Task with space but no project
  - [ ] Test breadcrumb with missing level
- [ ] Implement NoMilestone story
  - [ ] Task without milestone association
  - [ ] Verify layout without milestone section
- [ ] Implement LongContent story
  - [ ] Very long task title
  - [ ] Very long description
  - [ ] Test text wrapping and layout
- [ ] Implement LoadingStates story
  - [ ] Show loading states for various sections
  - [ ] Test skeleton loading patterns
- [ ] Implement ErrorStates story
  - [ ] Show error states for failed operations
  - [ ] Test error message display
- [ ] Implement MobileView story (if needed)
  - [ ] Optimized for mobile viewing
  - [ ] Test mobile-specific interactions

### Component Documentation

- [ ] Add JSDoc comments to TaskPage component
  - [ ] Document all props
  - [ ] Add usage examples
  - [ ] Document callback signatures
- [ ] Add JSDoc comments to StatusSelector
- [ ] Add JSDoc comments to TaskPageActions
- [ ] Add JSDoc comments to TaskPageSidebar
- [ ] Update main index.tsx exports

## Quality Assurance

### TypeScript Compliance

- [ ] Run `npx tsc --noEmit -p app/tsconfig.lint.json`
- [ ] Fix all TypeScript errors
- [ ] Ensure strict type checking passes
- [ ] Verify all interfaces are properly defined

### Testing

- [ ] Test all stories render without errors
- [ ] Test all interactive elements work
- [ ] Test responsive behavior at different breakpoints
- [ ] Test keyboard navigation
- [ ] Test accessibility with screen readers
- [ ] Test all callback functions

### Integration Testing

- [ ] Verify StatusSelector works in TaskItem
- [ ] Verify TaskBoard still functions correctly
- [ ] Test drag & drop functionality not broken
- [ ] Test all existing stories still work

### Code Review Checklist

- [ ] Components follow established patterns
- [ ] Props interfaces are minimal and focused
- [ ] No unnecessary dependencies
- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Accessibility attributes present
- [ ] Mobile responsiveness working
- [ ] Code is well-documented

## Future Enhancements (Optional)

### Advanced Features

- [ ] Add keyboard shortcuts
- [ ] Implement real-time updates
- [ ] Add task history/audit trail
- [ ] Implement drag & drop attachments
- [ ] Add task templates
- [ ] Add bulk operations

### Performance Optimizations

- [ ] Implement lazy loading for comments section
- [ ] Add React.memo for performance
- [ ] Optimize re-render patterns
- [ ] Add virtual scrolling if needed

### Additional Actions

- [ ] Move to Milestone action
- [ ] Convert to Goal action
- [ ] Export task action
- [ ] Print task action
- [ ] Share task action

## Completion Criteria

TaskPage implementation is complete when:

- [ ] All Phase 1-4 items are checked off
- [ ] All TypeScript checks pass
- [ ] All stories render and function correctly
- [ ] Component works on mobile and desktop
- [ ] All existing functionality remains intact
- [ ] Code review is complete and approved
- [ ] Documentation is comprehensive and accurate
