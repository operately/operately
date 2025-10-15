## Project & Milestone Subscription Lists Specification

### Feature Overview
- Extend the subscription infrastructure already in place for tasks to milestones and projects so we can surface comment notifications on milestones and expose the manual subscribe/unsubscribe toggle on projects.
- Mirror the existing task flows for milestone comments: auto-create `mentioned` subscriptions on mention, send notifications on subsequent comments, and cover the API, operations, activities, and tests end-to-end (including fixture updates).
- Introduce project-level subscription lists that power the overview sidebar toggle; expose subscribe/unsubscribe mutations, persist subscriptions (including duplicate-guarding), and surface the list for every project record in queries that need it.
- Ensure subscription lists exist for both new and pre-existing milestones and projects by adding schema migrations, data backfills, fixtures, seeds, factories, and API wiring identical in behavior to the task implementation.
- Document rollout constraints: migrations that add columns must ship ahead of code that requires them, and data backfills must be idempotent and restartable.
- Follow all AGENTS.md guidelines, especially around migrations in `app/lib/operately/data`, Elixir formatting boundaries, and commit/PR conventions.

### Stage 1 – Database & Schema Foundations
- **Step 1 — Add subscription_list references to milestones and projects**
  - Create migrations under `app/priv/repo/migrations/` that add `subscription_list_id` foreign keys to `project_milestones` and `projects`, mirroring naming, indices, and constraints from `20250929131526_add_subscription_list_to_project_tasks.exs` (including `null: false` constraints and indexes for FK lookups).
  - Update schemas in `app/lib/operately/projects/milestone.ex` and `app/lib/operately/projects/project.ex` to include `belongs_to :subscription_list, Operately.Notifications.SubscriptionList` and ensure preload helpers/tests compile.
  - Adjust Ecto changesets so that new structs require the association (e.g., `cast_assoc` or `put_assoc`), mirroring the task schema patterns, and ensure any multi-step creation flows (such as those using `Operately.Operations.ProjectCreation`) pass the association through.
- **Step 2 — Create subscription lists for new records**
  - Update milestone creation flows in `app/lib/operately_web/api/project_milestones.ex`, any context helpers, and supporting operations so they always build a subscription list alongside the milestone; ensure related fixtures (`app/test/support/fixtures/milestones_fixtures.ex`) follow suit.
  - Do the same for projects (check creation in `app/lib/operately_web/api/projects.ex`, any project creation operations, seeds, factories, and fixtures such as `app/test/support/fixtures/projects_fixtures.ex`).
  - Confirm API serializers include the subscription list relationship if required downstream and update GraphQL schema/types if exposure is needed for the UI toggle state.
- **Step 3 — Backfill existing rows**
  - Write data change modules in `app/lib/operately/data/` (e.g., `change_XXX_create_subscription_lists_for_milestones.ex` and `change_XXX_create_subscription_lists_for_projects.ex`) following the inline-schema pattern from `change_080_create_subscriptions_list_for_tasks.ex` (include explicit schemas for milestones/projects and subscription lists).
  - Create matching tests under `app/test/operately/data/` verifying idempotence and correct population, similar to `change_080_create_subscriptions_list_for_tasks_test.exs`, and cover edge cases like already-associated rows.
  - Add `up` migrations in `app/priv/repo/migrations/` that call the data changes to populate existing milestone/project rows and ensure the `down` direction either removes the column or raises with rationale, matching repo conventions.

### Stage 2 – Milestone Comment Subscription Flow
- **Step 1 — Mention subscription creation**
  - Extend `app/lib/operately/comments/create_milestone_comment_operation.ex` to handle milestone mention subscriptions: branch on resource type, locate the milestone subscription list, and create `mentioned` subscriptions mirroring the task logic from `app/lib/operately/operations/comment_adding/subscriptions.ex`.
  - Ensure the mutation handler (`app/lib/operately_web/api/mutations/post_milestone_comment.ex`) and client hook (`app/assets/js/pages/MilestonePage/useComments.tsx`) rely on `create_milestone_comment_operation.ex` for this flow. They should never depend on `app/lib/operately/operations/comment_adding.ex` for milestone comments.
  - Apply the same mention-creation rules as `comment_adding.ex`, including disallowing mentions when the action is `"complete"` or `"reopen"`, while keeping error handling and preload behavior consistent with the existing task flow.
- **Step 2 — Notification dispatch**
  - Implement `app/lib/operately/activities/notifications/project_milestone_commented.ex` to look up the milestone's subscription list and send notifications to `mentioned` subscribers, excluding the comment author, matching `project_task_commented` behavior. Confirm the activity is invoked from `app/lib/operately/comments/create_milestone_comment_operation.ex` when the comment is created so it mirrors the task flow without depending on `CommentAdding`.
  - Ensure the activity content carries enough data for notifications (project/milestone names, links, comment excerpt) and that fallback behavior for missing lists is safe (e.g., log and skip rather than crash), keeping the structure consistent with how `CommentAdding` composes the task notification payload.
- **Step 3 — Testing**
  - Add unit tests under `app/test/operately/comments/` (create the directory if needed) for `create_milestone_comment_operation.ex`, mirroring the task coverage (around line 786 in `comment_adding_test.exs`) but for milestones, validating mention subscription creation, idempotency, and notification recipients.
  - Expand feature coverage in `app/test/features/project_milestones_test.exs` to exercise mentions and confirm notifications, subscriptions, and UI responses, updating page helpers or step definitions as necessary.
  - Update factories/fixtures used in tests so milestone records include subscription lists (e.g., `app/test/support/fixtures/milestones_fixtures.ex`, `app/test/support/factory.ex`).

### Stage 3 – Project Subscription Toggle & Notifications Plumbing
- **Step 1 — Subscription list usage in API**
  - Ensure project loading endpoints (GraphQL queries used by `ProjectPage/OverviewSidebar`) expose whether the current user is subscribed; adjust serializers/resolvers as needed so the frontend can render the toggle state and maintain compatibility with existing consumers.
  - Reuse the existing mutations in `app/lib/operately_web/api/mutations/subscribe_to_notifications.ex` and `unsubscribe_from_notifications.ex` for projects. Extend their permission checks so projects are accepted as targets, then rely on the current code paths to create/remove `:joined` subscriptions against the project's subscription list (no new mutation modules or subscription types). When expanding `check_permissions`, treat project viewers with `:can_view` access as authorized to subscribe or unsubscribe; anything below that level must be rejected consistently across both mutations.
  - Update `Operately.Notifications.get_subscription_list_access_level/3` (and any similar helper invoked by the mutations) to resolve access levels for projects so permission checks receive the correct context.
  - Guard against duplicate subscriptions, handle concurrent requests safely, and ensure audit/logging remains accurate. Consider using `Repo.insert_all` with `on_conflict` if necessary.
- **Step 2 — Frontend enablement**
  - Reveal the toggle in `turboui/src/ProjectPage/OverviewSidebar.tsx` by replacing the hard-coded hidden state with logic based on the subscription status returned by the API. Follow TurboUI styling guidelines.
  - Implement handlers that call the subscribe/unsubscribe mutations and refresh the Apollo cache/state so the UI stays in sync (ensure optimistic updates or loading indicators as per existing patterns).
  - Add tests or stories if the TurboUI instructions require (check `turboui/AGENTS.md` for component testing expectations) and document any manual QA steps for the toggle.
- **Step 3 — Future notification hook (placeholder)**
  - Document TODOs or comments (without implementing) indicating where project-level notifications will plug in once defined, ensuring no dead code paths. Prefer inline module documentation over code comments when possible.
  - Verify no existing notification modules break when projects gain subscription lists (e.g., ensure default query filters account for the new resource and update any pattern matches that expect only tasks/milestones).
- **Step 4 — Testing**
  - Add backend tests ensuring subscribe/unsubscribe mutations manipulate project subscriptions correctly (unit tests and API tests as appropriate), including authorization failure cases and duplicate handling.
  - Write end-to-end/feature tests that cover toggling project subscriptions via the UI layer, verifying GraphQL responses and state changes. Update Cypress/Playwright suites if applicable.
  - Include regression coverage for project creation to assert subscription lists exist and that serialization exposes the subscription state to the frontend.

### QA & Rollout
- Run targeted Elixir and JS test suites after each stage (`make test.mix`, `make test.mix.features FILE=...`, `npm --prefix app run test` if frontend logic is covered by Jest) and regenerate types if GraphQL schema changes (`make gen`).
- Confirm background workers or asynchronous notification jobs respect the new subscription lists and that no duplicate notifications appear for task vs milestone contexts.
- Plan migrations carefully: deploy Stage 1 migrations before shipping code that assumes subscription lists exist, and coordinate data backfills with production DB operations.
- Ensure every milestone comment entry point (web mutation, email ingestion, mobile, or other future channels) ultimately routes through the shared `CommentAdding` pipeline so subscription creation and notifications stay consistent.
- Seed project subscription lists without automatically adding subscribers; the default state for both new and backfilled projects should be an empty list until a user explicitly opts in via the toggle.
- Exclude analytics or telemetry changes from the scope of these stages unless new requirements emerge; note any follow-up instrumentation needs separately for future work.
- For each stage, produce a dedicated PR summarizing the scoped changes, include screenshots for any UI toggles enabled, and ensure commits are signed off per repository guidelines.
