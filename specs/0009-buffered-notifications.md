# Buffered Activity Email Digests

**Summary**
- Add buffered delivery for activity-backed emails behind a company experimental feature named `buffered_notifications`.
- Keep in-app notifications immediate.
- Batch email by `person_id + fixed time window`, not by context. All non-bypassed notifications created for the same person inside the same open window land in one email.
- Group rows inside multi-item emails into `Projects`, `Goals`, `Spaces`, and `Other` sections. Each row still shows the specific parent resource or location label.
- Store user settings in a single embedded `preferences` field on `people`.
- Inside `preferences`, add a nested embedded `notifications` field for notification-related settings.
- Add notification settings inside `preferences.notifications`:
  - `email_preference` with `buffered` as the default
  - `email_window_minutes` with default `5`
  - `notify_about_assignments`, migrated from the current top-level field so existing assignment email behavior is preserved
  - `notify_on_mention`, migrated from the current top-level field
  - `send_daily_summary`, migrated from the current top-level field
- `mentions_only` lets real direct `@mentions` bypass buffering and send immediately. All other non-bypassed activity email still follows the normal buffered flow.
- Bypassed admin/access/invitation actions remain immediate regardless of the selected preference.
- If a batch resolves to a single notification at send time, render the existing single-notification mailer/template for that activity instead of the digest template.
- If `preferences.notifications.send_daily_summary` is enabled, send one daily summary email at `6:00 PM` in the user's timezone. If the user has no timezone, use the app's default timezone.
- The daily summary email should include that day's updates only, include the same rich excerpts used by buffered notification emails, and group rows into `Projects`, `Goals`, `Spaces`, and `Other`.
- Reading notifications in the app does not cancel the email. Non-activity transactional emails such as reset-password and activation emails remain unchanged.

**Implementation Changes**
- Add a single `preferences` field to `people`, implemented as an embedded schema.
- Inside `preferences`, add a nested embedded schema `notifications`.
- Move notification-related settings into `preferences.notifications`, including:
  - `email_preference` with values `:buffered` and `:mentions_only`
  - `email_window_minutes` with default `5`
  - `notify_about_assignments` migrated from the current top-level field
  - `notify_on_mention` migrated from the current top-level field
  - `send_daily_summary` migrated from the current top-level field
- Validate `email_window_minutes` against a fixed set of allowed values: `5`, `10`, `15`, `30`, `60`. The UI should use the same predefined options.
- Add a migration strategy that backfills:
  - `preferences.notifications.notify_about_assignments` from the current top-level `notify_about_assignments` field
  - `preferences.notifications.notify_on_mention` from the current top-level `notify_on_mention` field
  - `preferences.notifications.send_daily_summary` from the current top-level `send_daily_summary` field
- Update all current readers and writers to use the new embedded notification fields without changing user-visible behavior.
- Extend the people update API and serializers so the current user can read and update the new embedded notification settings.
- Add a new account settings flow:
  - When the feature flag is disabled, keep the direct `Appearance` item in `app/assets/js/layouts/CompanyLayout/User.tsx` and keep `Settings` hidden
  - When the feature flag is enabled, hide `Appearance` there and show `Settings` instead
  - Add a new settings page, modeled after `app/assets/js/pages/AccountSecurityPage/index.tsx`
  - The settings page should link to `Appearance`, which redirects to `app/assets/js/pages/AccountAppearancePage/index.tsx`
  - The settings page should also link to a new notifications settings page where the user can update notification preferences
- Replace context-scoped batching with person-scoped batching. `notification_email_batches` should group by `person_id` only, not `access_context_id`.
- Store on each batch: `person_id`, `status` (`scheduled`, `sending`, `sent`, `failed`, `skipped`), `window_started_at`, `send_at`, `sent_at`, `error`, and `window_minutes`.
- Add a follow-up migration that reshapes the PR 1 batch foundation from `person_id + access_context_id` to person-only batches.
- Extend `Operately.Notifications.bulk_create/1` so that after `insert_all` it loads each inserted notification with its activity and recipient, then partitions rows into:
  - `no_email`
  - `immediate_email`
  - `buffered_email`
- Use a single policy module to decide routing:
  - bypass actions are always immediate
  - `preferences.notifications.email_preference == :mentions_only` sends immediate email for direct mentions and adds all other non-bypassed activity to the current open batch for the person, or creates a new batch if none exists
  - `preferences.notifications.email_preference == :buffered` adds all non-bypassed activity, including direct mentions, to the current open batch for the person, or creates a new batch if none exists
- Keep the current `EmailWorker` for immediate delivery.
- Add `BufferedEmailWorker` on the `:mailer` queue. It should send the batch at the stored `send_at` time. Because the window is fixed, appending more notifications to the batch must not move `send_at`.
- Keep shared bookkeeping so both workers mark `notifications.email_sent` and `notifications.email_sent_at` on success. The batch worker should update all included notifications in one DB write.
- Add a central direct-mention classifier used by notification routing. It must identify whether the recipient is directly mentioned in the activity that produced the notification.
- Update the formatter contract so buffered items carry digest grouping data, including:
  - `section` with values `:project`, `:goal`, `:space`, `:other`
  - `section_label` for the specific project, goal, space, or fallback parent label shown in the email
  - existing digest fields such as `headline`, `excerpt_html`, `excerpt_text`, `item_url`, `actor_name`, `occurred_at`, and `coalesce_key`
- Implement `buffered_item/2` for every activity mailer currently reachable from the activity email pipeline. Non-activity transactional mailers stay outside this system.
- Add dedicated digest templates `buffered_activity_digest.html.eex` and `buffered_activity_digest.text.eex`. Do not append existing single-email templates.
- Render multi-item digests as:
  - header summarizing the batch window
  - grouped sections for `Projects`, `Goals`, `Spaces`, and `Other`
  - chronological rows inside each section
  - optional excerpts when the formatter provides them
  - per-item link
  - one footer CTA to the notifications page or settings page, not to a single resource
- Add a daily summary delivery path:
  - schedule a daily worker that runs frequently enough to pick up eligible users across timezones
  - select users with `preferences.notifications.send_daily_summary = true`
  - evaluate whether the current time is at or just after `6:00 PM` in each user's timezone, using the app's default timezone when the user has none
  - gather that day's non-bypassed activity notifications for the person
  - skip sending if there were no updates that day
  - render the email with the same digest item formatter and excerpt support used by buffered notification emails
  - group rows into `Projects`, `Goals`, `Spaces`, and `Other`
- Add delivery deduplication for daily summaries so a user receives at most one daily summary per local day.
- Keep fallback behavior explicit:
  - feature flag disabled falls back to the current immediate flow
  - unsupported formatter coverage falls back to the current immediate flow for `buffered`
  - unsupported formatter coverage falls back to the current immediate flow for `mentions_only` direct mentions as well

**Test Plan**
- Preference tests:
  - new users default to `preferences.notifications.email_preference = :buffered`
  - new users default to `preferences.notifications.email_window_minutes = 5`
  - `preferences.notifications.notify_about_assignments` preserves the current assignment-email default and behavior
  - `preferences.notifications.notify_on_mention` preserves the current mention-notification default and behavior
  - `preferences.notifications.send_daily_summary` preserves the current daily-summary default and behavior
  - valid window options persist correctly
  - invalid window values are rejected
  - `mentions_only` persists correctly
- Migration tests:
  - existing people with `notify_about_assignments = true` are backfilled into `preferences.notifications.notify_about_assignments = true`
  - existing people with `notify_about_assignments = false` are backfilled correctly
  - existing people with `notify_on_mention` are backfilled correctly
  - existing people with `send_daily_summary` are backfilled correctly
  - assignment reminder code continues to respect the migrated preference
- Batch creation tests:
  - same recipient plus different projects/goals/spaces inside one open window create a single batch
  - different recipients create separate batches
  - notifications after the fixed window create a new batch
  - appending notifications to an open batch does not move `send_at`
- Policy tests:
  - bypass actions stay immediate
  - `mentions_only` sends immediate email for direct mentions
  - `mentions_only` still routes non-mention activity into the batch path
  - `buffered` routes non-bypassed activity into the batch path
- Rendering tests:
  - a single-item batch uses the existing single-notification template
  - a multi-item batch renders grouped `Projects`, `Goals`, `Spaces`, and `Other` sections
  - items remain ordered by `occurred_at` within each section
  - excerpts and coalesced rows render correctly
- UI tests:
  - with the feature flag disabled, `CompanyLayout/User.tsx` shows `Appearance` and hides `Settings`
  - with the feature flag enabled, `CompanyLayout/User.tsx` shows `Settings` and hides `Appearance`
  - the new settings page links to appearance and notification settings
  - the notification settings page loads current preference and saves updates
  - the notification settings page always shows the buffer window selector
  - the notification settings page lets the user enable or disable daily summaries
- Daily summary tests:
  - eligible users receive one summary at `6:00 PM` in their timezone
  - users without a timezone use the app's default timezone
  - users with `send_daily_summary = false` receive no summary
  - users with no updates that day receive no summary
  - a daily summary is sent at most once per user per local day
  - the daily summary groups rows into `Projects`, `Goals`, `Spaces`, and `Other` and includes excerpts when available
- Bookkeeping tests:
  - successful immediate sends and successful digest sends both set `email_sent` and `email_sent_at`
  - `mentions_only` direct mentions are marked sent by the immediate path
  - `mentions_only` non-mention activity is marked sent when its buffered batch is delivered
- Integration coverage:
  - one mixed-context buffered batch
  - one mentions-only direct mention
  - one mentions-only non-mention routed into a buffered batch
  - one bypass action

**PR Breakdown**
1. **PR 1: Foundation schema and policy** `(Implemented)`
   - Added the initial batch schema foundation and buffered notification policy scaffold.
   - Result: groundwork only, no delivery behavior change.

2. **PR 2: Immediate delivery bookkeeping** `(Implemented)`
   - Fixed immediate email delivery bookkeeping so sent notifications record `email_sent` and `email_sent_at`.
   - Result: current immediate path now records delivery state correctly.

3. **PR 3: Preferences embed foundation on people** `(Implemented)`
   - Add a single embedded `preferences` field to `people`.
   - Inside it, add the nested `notifications` embed.
   - Move `notify_about_assignments`, `notify_on_mention`, and `send_daily_summary` into `preferences.notifications`.
   - Backfill existing data so assignment reminders and current notification-related behavior continue to behave exactly as they do today.
   - To backfill the data, create a data migration within app/test/operately/data/ and follow the Data Migration Guidelines in AGENTS.md.
   - Update current readers and writers to use the new embedded field.
   - Tests: embed defaults, backfill correctness, and compatibility with existing assignment and notification settings behavior.
   - Result: settings storage is consolidated without changing current behavior.

4. **PR 4: Notification preference fields and API on top of preferences embed** `(Implemented)`
   - Add `preferences.notifications.email_preference` and `preferences.notifications.email_window_minutes`.
   - Add defaults, validation, serializers, and people update API support.
   - Update `BufferedEmailPolicy` to read preference and fixed window from the embedded settings.
   - Tests: preference defaults, validation, serialization, and mutation coverage.
   - Result: the backend can store and expose the new notification preference model.

5. **PR 5: Account settings navigation shell** `(Implemented)`
   - Keep `Appearance` visible and keep `Settings` hidden in `app/assets/js/layouts/CompanyLayout/User.tsx` when the feature flag is disabled.
   - Hide `Appearance` and show `Settings` in that menu when the feature flag is enabled.
   - Add a new settings page modeled after `AccountSecurityPage`, with links to `Appearance` and `Notification settings`.
   - Route `Appearance` from the new settings page to `AccountAppearancePage`.
   - Tests: navigation and route coverage.
   - Result: the new settings entry point exists before notification settings UI is added.

6. **PR 6: Notification settings page** `(Implemented)`
   - Add the new notification settings page.
   - Let the user choose whether direct mentions also stay buffered or skip the buffer window and send immediately.
   - Always expose fixed window choices `5`, `10`, `15`, `30`, `60` minutes, because buffered delivery remains active in both modes.
   - Let the user enable or disable daily summary emails.
   - Save changes through the people update API from PR 4.
   - Tests: page load, form state, save behavior, and preference-specific UI behavior.
   - Result: users can configure the new preference model before batching behavior is enabled.

7. **PR 7: Batch model refactor and fixed-window scheduler** `(Implemented)`
   - Reshape the PR 1 batch foundation from context-based batches to person-only batches.
   - Add the follow-up migration needed to remove `access_context_id` from batch grouping and persist `window_minutes` on the batch.
   - Update `Operately.Notifications.bulk_create/1` to route notifications into `no_email`, `immediate_email`, and `buffered_email`.
   - Reuse one open batch per person and fixed window. Do not slide or extend `send_at`.
   - Add `BufferedEmailWorker` for fixed-time delivery.
   - Keep the feature flag off by default so the new routing path can merge safely before rollout.
   - Tests: fixed-window batch creation, mixed-context batching, and worker scheduling behavior.
   - Result: buffered routing works with the new batching rule, but rendering still uses fallback behavior until digest support is added.

8. **PR 8: Digest rendering foundation and section grouping** `(Implemented)`
   - Add digest templates and the batch rendering pipeline.
   - Implement single-item fallback to the existing mailer/template.
   - Update the formatter contract so buffered items declare digest section and section label.
   - Group multi-item digests into `Projects`, `Goals`, `Spaces`, and `Other`.
   - Keep fallback-to-immediate behavior for unsupported formatter coverage in `buffered` mode.
   - Tests: single-item fallback and grouped digest rendering from synthetic batch data.
   - Result: the email shape matches the new requirement, but coverage is still partial until formatter implementations are added.

9. **PR 9: Mention classification and high-volume formatter coverage**  `(Implemented)`
   - Add the direct-mention classifier used by `mentions_only`.
   - Implement `buffered_item/2` for the highest-volume collaborative activity mailers first: project, goal, task, and milestone changes.
   - Include excerpts where available.
   - Tests: mentions-only immediate mention delivery, mentions-only buffered non-mention delivery, and mixed project/goal/space digest rendering.
   - Result: the feature works for the main noisy activity families and for the new mentions-only mode.

10. **PR 10: Remaining formatter coverage and mixed-section coalescing** `(Implemented)`
   - Implement `buffered_item/2` for the remaining non-bypass activity types such as discussions, comments, check-ins, and resource-hub activity.
   - Keep per-event rows as-is in digest rendering (no coalescing).
   - Expand integration coverage across mixed action families and mixed digest sections.
   - Result: full buffered-email coverage for all non-bypass activity emails.

11. **PR 11: Daily summary delivery** `(Implemented)`
    - Add a daily summary worker scheduled once per day via cron (same operational model as assignments emails).
    - Reuse the digest formatter and grouping logic from buffered notification emails.
    - For each eligible user, collect notifications from the last 24 hours, exclude bypass actions, and skip empty summaries.
    - Respect `preferences.notifications.send_daily_summary`.
    - Keep the implementation simple: no timezone-specific `6:00 PM` scheduling and no persisted per-day dedup table.
    - Tests: eligibility filtering, last-24-hours window behavior, empty-summary suppression, and grouped summary rendering.
    - Result: users can opt into a once-daily digest of recent updates.

12. **PR 12: Rollout and observability**
    - Add logs, counters, and rollout notes for batch creation, mentions-only immediate mention bypasses, fixed-window delivery, send success/failure, and fallback-to-immediate cases.
    - Add observability for daily summary eligibility, send success/failure, empty-day skips, and deduplication skips.
    - Enable the company feature flag for internal or canary companies first, then broaden rollout after validation.
    - Tests: smoke coverage for the fully wired path with the feature flag enabled.
    - Result: controlled rollout for the completed feature.
