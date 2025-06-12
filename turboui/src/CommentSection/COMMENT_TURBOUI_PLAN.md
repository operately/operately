# TurboUI Comment System Implementation Plan

## Overview

This plan outlines the creation of turboui components for displaying comment feeds, starting with recreating existing functionality and then extending it for mixed comment/activity timelines.

## Phase 1: Basic Comment Components (Recreate Existing)

### 1.1 Core Comment Display Components

- [x] **CommentItem** - Individual comment display
  - [x] Avatar, author name, timestamp
  - [x] Rich content display (placeholder)
  - [x] Reactions support (placeholder)
  - [x] Edit/delete menu for own comments
  - [ ] Notification intersection handling
- [x] **CommentInput** - Comment composition

  - [x] Inactive state (placeholder with avatar)
  - [x] Active state (rich text editor placeholder)
  - [x] Post/Cancel buttons
  - [x] Upload progress handling
  - [x] Auto-focus and blur handling

- [x] **CommentList** - Container for multiple comments (integrated in CommentSection)
  - [x] Render different comment types
  - [x] Border/spacing handling
  - [ ] Loading states

### 1.2 Activity Components (from existing)

- [x] **MilestoneCompletedActivity** - Milestone completion notification
- [x] **MilestoneReopenedActivity** - Milestone reopening notification
- [x] **AcknowledgmentActivity** - Check-in acknowledgments

### 1.3 Supporting Components

- [x] **CommentSection** - Main container component
  - [x] Comment permissions handling
  - [x] Form state management integration
  - [x] Mixed content type rendering

### 1.4 Types and Interfaces

- [x] Define TypeScript interfaces
  - [x] `Comment` interface
  - [x] `CommentActivity` interface
  - [x] `CommentSectionProps` interface
  - [x] `CommentFormState` interface
  - [x] Union types for different activity types

### 1.5 Integration Requirements

- [ ] Form state integration (existing FormState pattern)
- [ ] Reaction system integration
- [ ] Rich text editor integration (TipTapEditor)
- [ ] Notification system integration
- [x] Avatar system integration (already in turboui)

### 1.6 Styling and Visual Polish

- [x] Fix Storybook background color issues
- [x] Match border colors from existing app (`border-stroke-base`)
- [x] Consistent spacing and layout with existing implementation
- [x] Wrap stories in Page component for realistic demo context
- [x] Integration with actual RichContent component
- [x] Integration with actual FormattedTime component
- [x] Use AvatarWithName with short name format and profile links
- [x] Show author names in activity components (not just avatars)

## Phase 2: Enhanced Timeline Component (New Functionality)

### 2.1 Activity Types for TaskPage Timeline

- [x] **TaskAssignmentActivity** - Person assigned to task
- [x] **TaskStatusChangeActivity** - Status updates (todo, in progress, done)
- [x] **TaskMilestoneActivity** - Task attached/detached from milestone
- [x] **TaskPriorityActivity** - Priority changes
- [x] **TaskDueDateActivity** - Due date changes
- [x] **TaskDescriptionActivity** - Description updates
- [x] **TaskTitleActivity** - Title changes
- [x] **TaskCreationActivity** - Task creation tracking

### 2.2 Timeline Component Architecture

- [x] **TimelineItem** - Generic timeline entry wrapper
  - [x] Avatar, timestamp, content area
  - [x] Support for both comments and activities
  - [x] Consistent spacing and borders
- [x] **Timeline** - Main timeline container
  - [x] Chronological sorting
  - [x] Mixed content rendering
  - [x] Empty state handling
  - [x] Filter options (comments only, activities only, all)

### 2.3 Activity Rendering Components

- [x] **ActivityIcon** - Dynamic icon selection based on activity type
- [x] **ActivityText** - Formatted text for different activity types
- [x] **ActivityDetails** - Additional context (old/new values, etc.)

## Phase 3: Storybook and Testing

### 3.1 Storybook Stories

- [ ] CommentItem stories
  - [ ] Default comment
  - [ ] Own comment (with menu)
  - [ ] Comment with reactions
  - [ ] Long content comment
- [ ] CommentInput stories
  - [ ] Inactive state
  - [ ] Active state
  - [ ] Loading state
- [ ] Activity stories for each type
- [ ] Timeline stories
  - [ ] Comments only
  - [ ] Activities only
  - [ ] Mixed timeline
  - [ ] Empty state

### 3.2 Component Tests

- [ ] Unit tests for comment rendering
- [ ] Unit tests for activity formatting
- [ ] Integration tests for form interactions
- [ ] Accessibility tests

## Phase 4: Integration and Migration

### 4.1 TaskPage Integration

- [x] Replace CommentsPlaceholder with Timeline component
- [x] Wire up task activity data
- [x] Handle permissions and form state
- [x] Test with real data in TaskPage stories

### 4.2 Existing Page Updates

- [ ] Evaluate GoalPage for timeline upgrade
- [ ] Evaluate MilestonePage for timeline upgrade
- [ ] Migration guide for other pages

### 4.3 Documentation

- [ ] Component usage documentation
- [ ] Migration guide from old CommentSection
- [ ] Activity type extensibility guide

## Technical Considerations

### File Structure

```
turboui/src/
├── Comments/
│   ├── index.tsx           # Main exports
│   ├── CommentItem.tsx
│   ├── CommentInput.tsx
│   ├── CommentList.tsx
│   ├── CommentSection.tsx
│   ├── types.ts
│   └── index.stories.tsx
├── Timeline/
│   ├── index.tsx           # Main exports
│   ├── Timeline.tsx
│   ├── TimelineItem.tsx
│   ├── ActivityComponents.tsx
│   ├── types.ts
│   └── index.stories.tsx
└── Activities/
    ├── index.tsx           # Activity type components
    ├── TaskActivities.tsx
    ├── MilestoneActivities.tsx
    ├── types.ts
    └── index.stories.tsx
```

### Data Flow Patterns

- Parent components provide data and callbacks
- Local state for UI interactions (editing, expanding)
- Event-driven updates for real-time features
- Optimistic updates for better UX

### Accessibility Requirements

- [ ] Proper ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Screen reader compatible
- [ ] Focus management for edit modes

### Performance Considerations

- [ ] Virtual scrolling for long timelines
- [ ] Lazy loading of rich content
- [ ] Memoization of expensive renders
- [ ] Optimized re-renders on updates

## Success Criteria

- [ ] All existing comment functionality recreated in turboui
- [ ] TaskPage has rich timeline with comments and activities
- [ ] Components are reusable across different page types
- [ ] Full test coverage and documentation
- [ ] Performance meets or exceeds current implementation
- [ ] Accessibility compliance maintained

## Notes

- Maintain backward compatibility during transition
- Consider animation/transitions for better UX
- Plan for real-time updates (websockets/polling)
- Design for extensibility (new activity types)
