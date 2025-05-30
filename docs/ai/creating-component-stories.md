# Creating Component Stories - AI Prompt Guide

This guide explains how to create effective Storybook stories for React components in the TurboUI library. Use this as a reference when generating stories for new or existing components.

## Story File Structure

### 1. Basic File Setup

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { ComponentName } from "./index";

/**
 * Component description explaining:
 * - Primary purpose and functionality
 * - Key features and capabilities
 * - Usage scenarios
 * - Important behavioral notes
 */
const meta: Meta<typeof ComponentName> = {
  title: "Components/ComponentName",
  component: ComponentName,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;
```

### 2. Essential Elements

**File Location**: Place stories in the same directory as the component: `src/ComponentName/index.stories.tsx`

**Documentation Comment**: Include a comprehensive JSDoc comment that explains:

- What the component does
- Key features (use bullet points)
- Important behaviors or states
- Usage context

**Meta Configuration**:

- Title follows pattern: `"Components/ComponentName"`
- Always include the component reference
- Use `layout: "fullscreen"` for consistency
- Use `satisfies Meta<typeof ComponentName>` for type safety

## Story Implementation Patterns

### 1. Comprehensive State Demonstration

Create an "AllStates" story that showcases all possible component states:

```tsx
export const AllStates: Story = {
  render: () => {
    // Create test data representing different scenarios
    const today = new Date();
    const pastDate = new Date(+new Date() - 14 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(+new Date() + 365 * 24 * 60 * 60 * 1000);

    return (
      <Page title="ComponentName All States" size="medium">
        <div className="grid grid-cols-3 gap-8 p-12">
          {/* Group related states logically */}
          <div>
            <h3 className="text-sm font-bold mb-2">State Name</h3>
            <ComponentName prop={value} />
          </div>

          {/* Include edge cases and combinations */}
          <div>
            <h3 className="text-sm font-bold mb-2">Edge Case</h3>
            <ComponentName prop={edgeValue} />
            <span className="text-xs text-content-dimmed">(Additional context)</span>
          </div>
        </div>
      </Page>
    );
  },
};
```

### 2. State Categories to Include

**Basic States**:

- Default/normal state
- Empty state
- Loading state (if applicable)
- Error state (if applicable)

**Interactive States**:

- Enabled vs disabled
- Read-only vs editable
- Focused vs unfocused
- Active vs inactive

**Data Variations**:

- Different data types/formats
- Minimum and maximum values
- Edge cases (null, undefined, empty strings)
- Realistic vs test data

**Visual Variations**:

- Different sizes (if supported)
- Different themes/styles
- With and without optional features
- Combined with other props

### 3. Naming Conventions

**State Labels**: Use clear, descriptive names:

- "Normal" for default state
- "Empty" for null/undefined data
- "Read-Only" for non-interactive state
- "Overdue" for time-sensitive states
- "With [Feature]" for optional features

**Story Names**: Use descriptive story names:

- `AllStates` for comprehensive overview
- `Interactive` for interaction testing
- `Variations` for different configurations

### 4. Layout and Organization

**Grid Layout**: Use CSS Grid for organized display:

- `grid-cols-3` for 3-column layout
- `gap-8` for consistent spacing
- `p-12` for page padding

**Grouping**: Organize states logically:

- Group similar states together
- Place edge cases after normal states
- Use visual hierarchy with headings

**Annotations**: Add explanatory text when needed:

- Use `text-content-dimmed` class for notes
- Explain non-obvious behaviors
- Clarify when states might not be visible

## Data Generation Patterns

### 1. Date/Time Data

```tsx
const today = new Date();
const pastDate = new Date(+new Date() - 14 * 24 * 60 * 60 * 1000);
const futureDate = new Date(+new Date() + 365 * 24 * 60 * 60 * 1000);
```

### 2. Text Content

```tsx
const shortText = "Brief content";
const longText = "This is a longer piece of content that might wrap or truncate";
const emptyText = "";
```

### 3. Numeric Values

```tsx
const minValue = 0;
const maxValue = 100;
const negativeValue = -10;
const decimalValue = 3.14;
```

## Best Practices

### 1. Component Props

- Always pass realistic prop combinations
- Test boolean props in both states
- Include optional props where relevant
- Test prop combinations that might conflict

### 2. Visual Testing

- Ensure all states are visually distinct
- Test responsive behavior when relevant
- Include both light and dark theme states if applicable
- Test with different content lengths

### 3. Accessibility

- Include states that affect accessibility
- Test keyboard navigation states
- Include ARIA states and labels
- Test screen reader relevant states

### 4. Performance

- Avoid creating expensive test data in render functions
- Use useMemo for complex calculations if needed
- Keep story rendering fast and efficient

## Example Implementation Checklist

When creating stories, ensure you include:

- [ ] Comprehensive JSDoc documentation
- [ ] All basic component states
- [ ] Edge cases and error states
- [ ] Interactive vs non-interactive states
- [ ] Empty and populated data states
- [ ] Realistic test data
- [ ] Clear state labels and descriptions
- [ ] Logical visual organization
- [ ] Explanatory annotations where needed
- [ ] Proper TypeScript types
- [ ] Consistent styling and layout

## Common Patterns by Component Type

### Form Components

- Empty, filled, error, disabled states
- Validation states (valid, invalid, pending)
- Different input types and formats
- Required vs optional states

### Display Components

- With data, without data
- Different data formats
- Loading and error states
- Various content lengths

### Interactive Components

- Enabled, disabled, loading states
- Before, during, and after interaction
- Success and error feedback states
- Different user permission levels

### Navigation Components

- Active, inactive, disabled states
- Different hierarchy levels
- With and without sub-items
- Various content types

Use this guide as a template when creating new component stories, adapting the specific states and data to match your component's functionality and use cases.
