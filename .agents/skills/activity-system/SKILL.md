---
name: activity-system
description: >-
  Guidelines for Operately's activity system — the event log that powers the
  activity feed, notifications, and audit logs. Use when creating or changing
  an activity type, a content handler, a notification handler, an activity
  feed handler, or files under app/lib/operately/activities,
  app/lib/operately_web/api/serializers/activity_content, or
  app/assets/js/features/activities.
---

# Activity System

Activities are the event log of the application. When significant actions
happen (e.g., creating a project, updating a goal), an activity record is
created. Activities power the activity feed, notifications, and audit logs.
Creating a new activity requires implementing five components across backend
and frontend.

## Activity Components

1. **Content Handler** (`app/lib/operately/activities/content/[action_name].ex`): Embedded Ecto schema defining activity data structure
2. **Notification Handler** (`app/lib/operately/activities/notifications/[action_name].ex`): Determines who receives notifications
3. **Type Definition** (`app/lib/operately_web/api/types.ex`): GraphQL type for the activity content
4. **Serializer** (`app/lib/operately_web/api/serializers/activity_content/[action_name].ex`): Converts content to API format
5. **Feed Handler** (`app/assets/js/features/activities/[ActionName]/index.tsx`): Renders the activity in UI

**Examples:** See `project_created`, `goal_created`, `project_champion_updating` for reference implementations of all components.

## Creating Activities

Activities are inserted in operations using `Activities.insert_sync/4` within an `Ecto.Multi` transaction.

**Example:** `app/lib/operately/operations/project_creation.ex:171-177`

## Content Handler

Embedded Ecto schema with `use Operately.Activities.Content`. Module name is PascalCase (e.g., `project_created` → `ProjectCreated`). Use `belongs_to` with `type: :string` for IDs. Implement `changeset/1` and `build/1`.

**Examples:** `app/lib/operately/activities/content/{project_created,goal_created,space_added}.ex`

## Type Definition

Add `object :activity_content_[action_name]` to `app/lib/operately_web/api/types.ex`. Use `field` for required, `field?` for optional. Keep macro style without parentheses.

**Examples:** Search for `activity_content_` in `app/lib/operately_web/api/types.ex`

## Serializer

Implement `OperatelyWeb.Api.Serializable` protocol. Access content with string keys, use `Serializer.serialize/2` for nested objects with `level`, return map with atom keys.

**Examples:** `app/lib/operately_web/api/serializers/activity_content/{project_created,goal_closing}.ex`

## Feed Handler

Implement `ActivityHandler` interface in `app/assets/js/features/activities/[ActionName]/index.tsx`. Import type from `@/api`, add proper null guards (never use `!`), check `page` parameter for context-aware rendering. Register in `index.tsx`: import, add to `DISPLAYED_IN_FEED`, add `.with()` clause.

**Examples:** `app/assets/js/features/activities/{ProjectCreated,GoalCreated,ProjectChampionUpdating}/index.tsx`

## Null Guards in Feed Handlers

When TypeScript warns that a value may be `null` or `undefined` (common in
activity handlers under `app/assets/js/features/activities`), do not silence
the warning with the non-null assertion operator (`!`) or with helpers like
`assertPresent`. Add the guards or type refinements needed so the compiler is
satisfied without risking runtime errors.
