# TaskPage Implementation Specification

## Overview
Create a comprehensive TaskPage component that displays and allows editing of individual tasks. The page follows the same two-column layout pattern as GoalPage with mobile-responsive design.

## Component Interface

```typescript
interface TaskPageProps {
  // Core task data
  name: string;
  onNameChange: (newName: string) => void;
  
  description: string;
  onDescriptionChange: (newDescription: string) => void;
  
  status: Status; // from ../types.ts
  onStatusChange: (newStatus: Status) => void;
  
  dueDate?: Date;
  onDueDateChange: (newDate: Date | null) => void;
  
  assignees?: Person[];
  onAssigneesChange: (newAssignees: Person[]) => void;
  
  // Hierarchy/Navigation
  spaceName?: string;
  spaceUrl?: string;
  projectName?: string;
  projectUrl?: string;
  milestoneName?: string;
  milestoneUrl?: string;
  
  // Metadata (read-only)
  createdAt: Date;
  createdBy: Person;
  
  // Subscription
  isSubscribed: boolean;
  onSubscriptionToggle: (subscribed: boolean) => void;
  
  // Actions
  onCopyUrl: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  
  // Search functionality for assignees
  searchPeople?: (params: { query: string }) => Promise<Person[]>;
}
```

## Layout Structure

### Desktop Layout (Two-Column)
```
┌─────────────────────────────────────────────────────────────┐
│ [Space > Project] breadcrumb                                │
│ [Status Badge] Task Title (editable)                       │
│                                                             │
│ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Main Content                │ │ Sidebar                 │ │
│ │                             │ │                         │ │
│ │ Description (editable)      │ │ Due Date                │ │
│ │                             │ │ Assignees               │ │
│ │ Comments/Activity           │ │ Milestone               │ │
│ │ (placeholder)               │ │ Notifications           │ │
│ │                             │ │ ─────────────────       │ │
│ │                             │ │ Actions                 │ │
│ │                             │ │ • Copy URL              │ │
│ │                             │ │ • Delete                │ │
│ │                             │ │ • Duplicate             │ │
│ │                             │ │ • Archive               │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)
```
┌───────────────────────────────┐
│ [Space > Project] breadcrumb  │
│ [Status] Task Title           │
│                               │
│ Due Date | Assignees          │
│ Milestone                     │
│                               │
│ Description (editable)        │
│                               │
│ Notifications                 │
│                               │
│ Comments/Activity             │
│ (placeholder)                 │
│                               │
│ Actions Menu                  │
└───────────────────────────────┘
```

## Components to Extract/Create

### 1. StatusSelector Component
- **Location**: `src/StatusSelector/`
- **Purpose**: Extract status selection logic from TaskItem
- **Interface**:
  ```typescript
  interface StatusSelectorProps {
    status: Status;
    onChange: (newStatus: Status) => void;
    size?: 'sm' | 'md' | 'lg';
    readonly?: boolean;
  }
  ```
- **Features**: Dropdown/select with status options, color-coded badges

### 2. TaskPageActions Component
- **Location**: `src/TaskBoard/components/TaskPageActions.tsx`
- **Purpose**: Action menu for task operations
- **Interface**:
  ```typescript
  interface TaskPageActionsProps {
    onCopyUrl: () => void;
    onDelete: () => void;
    onDuplicate?: () => void;
    onArchive?: () => void;
  }
  ```

### 3. TaskPageSidebar Component
- **Location**: `src/TaskBoard/components/TaskPageSidebar.tsx`
- **Purpose**: Sidebar content for desktop, inline content for mobile
- **Features**: Due date, assignees, milestone, notifications, actions

## Implementation Steps

### Phase 1: Foundation Components
1. **Extract StatusSelector from TaskItem**
   - Create `src/StatusSelector/index.tsx`
   - Create `src/StatusSelector/index.stories.tsx`
   - Update TaskItem to use StatusSelector
   - Test all existing TaskItem functionality

2. **Create TaskPageActions component**
   - Implement action menu with provided callbacks
   - Handle action states (loading, disabled, etc.)
   - Create comprehensive stories

3. **Create TaskPageSidebar component**
   - Desktop sidebar layout
   - Mobile inline layout using responsive classes
   - Stories for both layouts

### Phase 2: Main TaskPage Component
4. **Create TaskPage main component structure**
   - Two-column layout using CSS Grid/Flexbox
   - Breadcrumb navigation (reuse existing patterns from GoalPage)
   - Responsive breakpoints

5. **Implement editable title**
   - Use EditableText component (if exists) or create inline editing
   - Handle save/cancel states
   - Validation and error states

6. **Implement description editing**
   - Follow GoalPage pattern exactly
   - RichEditor integration
   - Edit/save/cancel flow

### Phase 3: Integration & Polish
7. **Add metadata display**
   - Created date formatting
   - Creator information (name + avatar)
   - Secondary visual hierarchy

8. **Implement subscription toggle**
   - Simple switch/toggle component
   - Subscription status messaging
   - Loading and error states

9. **Mobile responsive optimization**
   - Test sidebar-to-inline transition
   - Touch-friendly interactions
   - Content reordering for mobile priority

### Phase 4: Stories & Documentation
10. **Create TaskPage stories**
    - Default state (complete task)
    - Loading states
    - Error states
    - Empty states (no assignees, no due date, etc.)
    - Different hierarchy levels (with/without project)
    - Mobile-specific stories

11. **Create component documentation**
    - Usage examples
    - Props documentation
    - Integration guidelines

## Story Requirements

### TaskPage.stories.tsx Structure
```typescript
export default {
  title: "Pages/TaskPage",
  component: TaskPage,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-[800px] py-[4.5rem] px-2">
        <Page title="Task Details" size="fullwidth">
          <Story />
        </Page>
      </div>
    ),
  ],
};

// Stories to include:
- Default: Complete task with all fields
- MinimalTask: Task with minimal data
- NoProject: Task with space but no project
- NoMilestone: Task without milestone
- LongContent: Task with very long description
- MobileView: Mobile-optimized story
- LoadingStates: Various loading scenarios
- ErrorStates: Error handling scenarios
```

## Mobile Responsive Behavior

### Breakpoint Strategy
- **Desktop**: `lg` and above (1024px+) - Two-column layout
- **Tablet**: `md` to `lg` (768px-1023px) - Two-column with smaller sidebar
- **Mobile**: Below `md` (767px and below) - Single column, inline sidebar items

### Mobile Content Priority
1. Breadcrumb (condensed)
2. Status + Title
3. Due Date + Assignees (inline row)
4. Milestone (if present)
5. Description
6. Subscription toggle
7. Comments/Activity
8. Actions (collapsed menu)

### Mobile-Specific Interactions
- Actions in collapsed menu (three-dot menu)
- Due date and assignees in compact inline format
- Touch-friendly edit buttons and form controls
- Optimized spacing for thumb navigation

## Additional Action Suggestions
Beyond Copy URL and Delete, consider these actions:
- **Duplicate**: Create copy of task
- **Archive**: Soft delete/hide task
- **Move to Milestone**: Change milestone assignment
- **Convert to Goal**: Escalate task to goal
- **Export**: Export task details
- **Print**: Print-friendly view

## Technical Considerations

### State Management Pattern
For editable fields (name, description), use internal buffering to prevent excessive API calls:

```typescript
// ❌ BAD: Sends data to API on every keypress
function NameInput({name, onChange}) {
   return <input value={name} onChange={onChange} />
}

// ✅ GOOD: Internal buffer, send update once typing is done
function NameInput({name, onChange}) {
  const [buffer, setBuffer] = useState(name);

  React.useEffect(() => setBuffer(name), [name]); // update buffer if name changes externally

  return (
    <input 
      value={buffer} 
      onChange={(e) => setBuffer(e.target.value)} 
      onBlur={() => onChange(buffer)} 
      onKeyPress={(e) => e.key === 'Enter' && onChange(buffer)} 
    />
  );
}
```

**Key principles:**
- Maintain internal state buffer for text inputs
- Sync buffer with external props via useEffect
- Trigger callbacks on blur and Enter key
- Provide immediate visual feedback while typing

### Performance
- Lazy load comment/activity section
- Optimize re-renders with memo/callback patterns
- Efficient prop drilling (consider context if needed)

### Accessibility
- Proper heading hierarchy
- Focus management for inline editing
- Screen reader friendly action menus
- Keyboard navigation support

### Error Handling
- Graceful degradation for missing data
- Network error states
- Validation error display
- Retry mechanisms for failed actions

## Testing Strategy
- Unit tests for individual components
- Integration tests for full page flow
- Responsive design testing
- Accessibility testing
- Cross-browser compatibility

## Future Enhancements
- Real-time collaboration indicators
- Task history/audit trail
- Advanced keyboard shortcuts
- Drag & drop attachments
- Task templates
- Bulk operations from task page