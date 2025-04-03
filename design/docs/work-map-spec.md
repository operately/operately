# Work Map Screen Specification

## Overview

The Work Map is a central dashboard within Operately that provides a hierarchical visualization of an organization's strategic initiatives, connecting high-level goals with their associated sub-goals projects. It serves as a visual representation of Operately's core mission: connecting strategic goals with day-to-day execution.

## Purpose

The Work Map enables users to:

1. Visualize the relationship between strategic goals and tactical projects
2. Track progress across all work initiatives in the organization
3. Monitor status, ownership, and deadlines for both goals and projects
4. Navigate through a hierarchical breakdown of work to focus on specific areas
5. Quickly identify next steps for any initiative

## Core Elements

### Header Section

- TBD

### Table Structure

- Takes maximum amount of screen width that the browser allows
- Hierarchical, expandable/collapsible table showing goals and their associated projects
- Visual indentation to indicate parent-child relationships
- Expand/collapse controls to focus on specific branches of work

### Item Differentiation

- Clear visual distinction between goals and projects:
  - Goals: Represented with target icons and red accents
  - Projects: Represented with checklist icons and blue accents
- Appropriate spacing and visual hierarchy to enhance readability

### Key Information Columns

The table provides at-a-glance information through the following columns:

1. **Name**: Item name with appropriate visual identification and hierarchy controls. Links to the initiative's detailed view page.
2. **Status**: Status of the latest check-in displayed using the application's status badge system. Could be one of "Pending" (blue), "Paused" (grey), On track (green), Caution (yellow/orange), "Issue" (red), "Completed" (green), "Failed" (red), "Dropped" (grey).
3. **Progress**: Visual progress bar showing completion percentage, in the same color as the status badge.
4. **Space**: The space (department or team) associated with the initiative, links to the space page.
5. **Owner**: Assigned champion (owner) with visual representation (avatar or initials in colored circle when avatar is missing), links to the person profile page.
6. **Deadline**: Target completion date with visual indication when the date is overdue. It's always a concrete date like "Jun 20", "Jun 20, 2024" when the year is not current year, or "Undefined" when the deadline is not set, which should be visually different from a date.
7. **Next Step**: Brief description of the immediate next action required. It is either the next project milestone or the first incomplete goal target.

## Interactions

### Expandable Rows

- Each goal can be expanded to show associated projects
- Expansion state is preserved during navigation
- Visual indicators show whether an item has children and its current expansion state
