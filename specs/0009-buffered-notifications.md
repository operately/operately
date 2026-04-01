# Buffered Activity Email Digests

**Summary**
- Add buffered delivery for activity-backed emails behind a company experimental feature named `buffered_notifications`.
- Keep in-app notifications immediate.
- Batch by `person_id + access_context_id`, so all child activity under the same parent company, space, project, goal, or resource-hub context lands in one email.
- Use a sliding 5-minute window for buffered batches: each new notification in the same context resets the send timer.
- Do not suppress the digest if the user already read those notifications in-app before send time.
- Non-activity transactional emails such as reset-password and activation emails remain unchanged.

**Implementation Changes**
- Add a new `notification_email_batches` table and a nullable `notifications.email_batch_id` foreign key.
- Store on each batch: `person_id`, `access_context_id`, `status` (`scheduled`, `sending`, `sent`, `failed`, `skipped`), `window_started_at`, `send_at`, `sent_at`, and `error`.
- Extend `Operately.Notifications.bulk_create/1` so that after `insert_all` it loads each inserted notification’s `activity.action` and `activity.access_context_id`, then partitions rows into `no_email`, `immediate_email`, and `buffered_email`.
- Add a single policy module that owns: the feature flag check, the default buffer window (`5` minutes via app config), and the bypass list.
- Keep these actions immediate even when buffering is enabled: `guest_invited`, `company_member_added`, `company_member_removed`, `company_member_restoring`, `company_member_converted_to_guest`, `company_admin_added`, `company_admin_removed`, `company_owners_adding`, `company_owner_removing`, `company_members_permissions_edited`, `space_members_added`, `space_member_removed`, `space_members_permissions_edited`, `space_permissions_edited`, `project_contributor_addition`, `project_contributors_addition`, `project_contributor_removed`, `project_contributor_edited`, and `project_permissions_edited`.
- For buffered candidates, lock the recipient `people` row inside the transaction, reuse the latest `scheduled` batch for the same `access_context_id` with `send_at > now`, append the new notification to it, and move `send_at` to `now + 5 minutes`. If no eligible batch exists, create one with `send_at = now + 5 minutes`.
- Enqueue one `BufferedEmailWorker` on the `:mailer` queue when a batch is created. When the worker wakes up, it must compare `batch.send_at` to `now`; if the batch was extended, the worker must re-enqueue itself for the remaining delay instead of sending early.
- Keep the current `EmailWorker` for immediate/bypass delivery.
- Fix delivery bookkeeping so both workers set `notifications.email_sent` and `notifications.email_sent_at` on success. The batch worker also marks the batch `sent` and updates all included notifications in one DB write.
- Add a new formatter contract, implemented alongside the existing activity mailers: `buffered_item(person, activity) -> %{headline, excerpt_html, excerpt_text, item_url, actor_name, occurred_at, coalesce_key}`.
- Implement `buffered_item/2` for every activity mailer currently reachable from the activity email pipeline; non-activity transactional mailers stay outside this system.
- Add dedicated digest templates `buffered_activity_digest.html.eex` and `buffered_activity_digest.text.eex`. Do not append existing single-email templates.
- At send time, if the batch contains exactly one notification, use the existing single-notification mailer and template for that activity instead of the digest template. Use the digest template only when the final batch size is greater than one.
- Render digests as: header `Updates in <context>`, subtitle with actor/count summary, chronological timeline rows, optional excerpts, per-item link, and one CTA to the parent context.
- Add a context presenter that turns `Access.Context` into `{type, name, url, cta_label}` for company, space, project, goal, and resource-hub contexts.
- Support limited semantic merging through `coalesce_key`: repeated mutation events with the same key collapse to the latest item plus a repeat count; comments, discussions, and check-ins stay as separate timeline entries.
- Fallback to immediate delivery when buffering is disabled, the action is bypassed, `access_context_id` is missing, or `buffered_item/2` is not implemented yet.

**Test Plan**
- Batch creation tests: same recipient and same `access_context_id` inside 5 minutes creates one batch, appends notifications to it, and moves `send_at` forward each time.
- Separation tests: different contexts create separate batches; events after the window create a new batch.
- Worker timing tests: if a worker wakes before the latest `send_at`, it re-enqueues itself and does not send early.
- Policy tests: feature flag off uses immediate delivery; bypass actions stay immediate with the flag on; missing formatter or missing context falls back to immediate delivery.
- Rendering tests: a single-item batch uses the existing single-notification template; a multi-item batch renders the digest in chronological order, includes excerpts when present, coalesces repeated mutation items when keys match, and produces readable HTML and text output.
- Bookkeeping tests: successful immediate sends and successful digest sends both set `email_sent` and `email_sent_at`; retrying a sent batch is a no-op.
- Integration coverage: one project-context batch, one goal-context batch, one company or space-context batch, and one bypass action.

**PR Breakdown**
1. **PR 1: Foundation schema and policy**
   - Add the `buffered_notifications` experimental feature check and the configurable buffer window.
   - Add `notification_email_batches`, `notifications.email_batch_id`, batch schema, status handling, and query helpers.
   - Add the central policy module with the bypass-action list.
   - Tests: migration/schema coverage and policy behavior.
   - Result: no user-visible behavior change.

2. **PR 2: Immediate delivery bookkeeping**
   - Fix the current immediate email path so `EmailWorker` marks `email_sent` and `email_sent_at` on success.
   - Extract shared delivery bookkeeping helpers that the future batch worker will reuse.
   - Tests: existing immediate email flows still send and now update bookkeeping correctly.
   - Result: no buffering yet, but current state becomes correct and reusable.

3. **PR 3: Batch scheduling and worker lifecycle**
   - Update `Operately.Notifications.bulk_create/1` to partition notifications into `no_email`, `immediate_email`, and `buffered_email`.
   - For buffered candidates, create or extend batches per `person_id + access_context_id`, resetting `send_at` to `now + 5 minutes`.
   - Add `BufferedEmailWorker` with the re-enqueue-if-extended behavior.
   - Keep the feature flag off by default so the new path is merged safely before rollout.
   - Tests: batch creation, batch extension, and worker timing behavior.

4. **PR 4: Rendering foundation and single-item fallback**
   - Add the context presenter and digest templates.
   - Add the `buffered_item/2` contract and the batch rendering pipeline.
   - Implement send-time branching: one notification uses the existing single-notification mailer/template, multiple notifications use the digest template.
   - Keep the fallback-to-immediate behavior for missing formatter coverage.
   - Tests: single-item fallback and digest rendering from synthetic batch data.

5. **PR 5: Formatter coverage for high-volume project and goal activity**
   - Implement `buffered_item/2` for the highest-noise collaborative activity mailers first: project, goal, task, and milestone changes.
   - Include excerpts for comments and rich-text edits where available.
   - Add end-to-end tests for project-context and goal-context multi-item digests.
   - Result: the feature is usable for the main spam-heavy cases while still falling back to immediate emails for unsupported actions.

6. **PR 6: Formatter coverage for remaining buffered activity and coalescing**
   - Implement `buffered_item/2` for the remaining non-bypass buffered activity types such as discussions, comments, check-ins, and resource-hub activity.
   - Add `coalesce_key` handling so repeated mutation events collapse cleanly while comments and discussions remain separate.
   - Expand integration coverage across mixed action families.
   - Result: full buffered-email coverage for all non-bypass activity emails.

7. **PR 7: Rollout and observability**
   - Add the logs, counters, and admin-facing rollout notes needed to monitor batch creation, rescheduling, send success, send failure, and fallback-to-immediate cases.
   - Enable the company feature flag for internal or canary companies first, then broaden rollout after validation.
   - Tests: smoke coverage for the fully wired path with the feature flag enabled.
   - Result: controlled production rollout instead of a single hard cutover.
