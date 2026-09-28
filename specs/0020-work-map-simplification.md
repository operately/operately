# Work Map simplification — design brief

Replace the five tabs with one screen people can adjust. Use the same design for the company Work Map and each Space’s Work Map.

## Starting point

- Show active goals and projects in the nested table.
- Keep a visible **Table / Timeline** switch.
- Show applied filters so people can tell what is hidden.
- Let organizers reorder work and save a default view for others.
- Each map has its own order. Changing the company map’s order does not change a Space map’s order.

## What to design

| Part | Needs to cover |
| --- | --- |
| Main toolbar | Table / Timeline, Filter, display options, Add work |
| Filters | Goals/projects, status, Space, champion, name, dates |
| Display options | Sorting; explore whether a flat list is useful alongside the hierarchy |
| Shared default | Save the current view for everyone; return to the saved default |
| Reordering | Move items up/down; make clear that the order changes for everyone viewing this map |
| Templates | Choose a template when creating a project; find the template library from the map |

Control placement and labels are starting ideas, not settled decisions.

## Filters

Start with one Status menu, with separate Goals and Projects sections. Selecting “Goals: At risk” and “Projects: Attention” shows both sets. Adding a champion filter narrows both sets to that person.

Include quick choices for Active, Paused, and Completed inside the menu. Detailed filter options are in [issue #2517](https://github.com/operately/operately/issues/2517).

Explore how to show a matching project when its parent goal does not match. First option: keep the goal visible as context, with a clear visual distinction.

## Timeline

First direction to try:

- Keep names and hierarchy fixed on the left; scroll dates on the right.
- Use normal bars for projects and thinner spans for goals.
- Let long goals continue beyond the visible date range.
- Offer Weeks / Months / Quarters and a Today control.
- Keep undated items visible. Show a marker for items with only a due date.
- Keep the same filters and row order when switching from Table.

Design with a three-year goal, quarterly subgoals, two-week projects, and undated work together. The question: can you understand the long-term goal and still read the short projects?

## Organizing and saving

Filtering and switching views initially affect only the person using them. Saving a default is an explicit action for someone with permission.

Explore a clear way to reorder items within the same parent. Moving a goal should carry its children. Changing a parent is a different action.

Two questions to resolve in the designs:

- How do we distinguish personal adjustments from changes for everyone?
- What happens when someone wants to reorder a filtered list?

## Templates

First option: choose a template during project creation, and open Project Templates from the map’s menu. The company library shows templates across accessible Spaces; each Space library shows its own.

Try this placement before adding another navigation item.

## References

- [Linear filters](https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42)
- [Asana portfolio timeline](https://mobbin.com/screens/27eaa364-d5d4-42a7-960a-da733db90f7d)
- [Confluence timeline and zoom controls](https://mobbin.com/screens/2a2a4efd-a15f-4faa-a8a9-65381ae9de0c)
