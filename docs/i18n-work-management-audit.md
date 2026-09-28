# Work-management extraction audit (PR 6)

PR 6 is **in progress**. This extraction batch adds catalog lookup across the surfaces below. It does not close the full work-management inventory. PR 5's completed shared, account/onboarding, and administration coverage remains complete.

## Extracted in this batch

| Surface | Coverage |
| --- | --- |
| Goal and project overview | Tabs, description fields, sidebar labels and empty states, champion/reviewer explanations, check-in lists and overdue notices, discussion empty states, related-work actions, and deletion confirmations |
| Goal creation | Form labels, placeholders, parent-goal sentence, required validation, and failure toast |
| Task operations | App page and project/space task hooks: due dates, reminders, assignees, descriptions, status, milestone changes, deletion, and movement errors; generic “Update failed” titles; project-field rollback messages |
| Supporting operations | Goal targets/checklists, project contributors, milestone ordering/status configuration, Kanban positioning, comment/reaction failure messages |
| Task and milestone UI | Task sidebar, reminder labels, move/delete dialogs, milestone lists, milestone-page labels, and task-section empty states |
| Task board | Filter field/operator controls, empty filter lists, display/settings menus, status editing, milestone creation/selection, task indicators, progress accessibility text, and completed-task/milestone plural counts |
| Docs & Files | Preview and folder empty states, draft prompt, search feedback, document/file/link editor labels and placeholders, folder creation, resource menu actions, move/copy/delete confirmation copy, public-sharing modal, and updated-at presentation |
| Space surfaces | Space home chrome and deletion, space-tool empty states/examples, discussions listing, work-map loading-option errors, work-map add dialog and table/navigation controls, Kanban heading |
| KPIs | List/summary headings and empty states, chart empty states/accessibility label, KPI creation, annotation form, KPI deletion, and app-wrapper fallback/toast errors |
| Activity presentation | `GoalCreated`, `ProjectCreated`, `TaskNameUpdating`, and `TaskDescriptionChange`, including their notification titles |

Translation happens at render/operation time. Resource names, user-authored text, stored activity payloads, API fields, IDs, status values, routes, and test selectors retain their existing meaning. New Portuguese entries remain untranslated and fall back to English. Existing PO translations and headers are preserved.

The existing TurboUI primitives are reused: buttons, links, `Modal`, callouts, `Forms`, `TextField`, date/person/space/privacy/milestone fields, `SwitchToggle`, menus, and `FormattedTime`. This batch introduces no raw interactive controls. Existing raw controls in legacy task-board/KPI/space surfaces retain their current behavior. The shared modal now associates its existing translated heading with the dialog's accessible name.

## Validation

- Substituted catalogs exercise goal creation/validation/failure, project check-in errors, task-operation failures and rollback, milestone selection/creation, Docs & Files empty/deletion states, discussion permissions/empty states, KPI empty/error states, and work-map creation validation.
- Activity tests cover English and missing-Portuguese fallback, reordered rich translations, escaped user names, preserved destinations and payloads, and the existing aggregation/deleted-task regressions.
- Zero, singular, and plural completed-milestone counts are tested with missing Portuguese translations and substituted plural forms.
- The effective-language test applies a saved Portuguese preference with the company flag disabled and verifies English work-management output.
- TurboUI unit tests and Storybook's Chromium interaction/smoke suite exercise existing English workflows. `MilestoneCreationModal.ExpandedCatalog` exercises expanded text, its accessible dialog/close labels, input/submit state, and horizontal overflow in the browser.
- App and TurboUI TypeScript checks, focused app tests, and the catalog/converter/frontend-extractor tests are run. `make gen.i18n` regenerates POT, PO, and JSON; repeat generation is byte-identical. Existing PO translations and headers are compared against the branch base.

Recorded results for this batch: 181 TurboUI suites / 1,228 tests passed; 156 Chromium Storybook suites / 742 checks passed; 39 focused app tests passed; 30 i18n tooling tests passed. `make test.tsc.lint`, `make turboui.build`, and TurboUI's `npm run lint` passed. Placeholder and rich-tag integrity was verified for the 482 added English JSON keys and their generated Portuguese fallbacks.

## Remaining PR 6 work

These client-authored gaps remain PR 6 work, **not PR 7 deferrals**:

- Goal access pages (`GoalAccess*`, `GoalEditAccessLevelsPage`), goal check-in/closing/reopening/discussion forms, target/checklist editors, and remaining contributor presentation.
- Project add/check-in/closing/pause/resume/retrospective/discussion forms and their app-supplied copy; shared `ProjectPageLayout/StatusBanner`, `CheckInHeader`, `CheckInCard`, and `LastCheckIn` presentation.
- Remaining shared work-management fields and status customization/display components, subscription/comment/timeline presentation, and milestone-completion explanatory sentences.
- Remaining task-board sentences and accessibility audit, including selected filter descriptions, milestone/task count summaries outside the converted completed sections, and Kanban add-status presentation.
- Remaining discussion composer/draft pages and related wrapper errors.
- Docs & Files upload/add menus and failures, resource version history/comparison/restore, document display/header actions, copy naming defaults, editor submit/validation copy, remaining folder-selector labels, and app resource wrappers/hooks.
- Most activity handlers beyond the four listed above, plus activity/timeline parsing and supporting feed presentation. Keep translations out of stored activity data.
- Remaining work-map tabs, row summaries/tooltips, timeline and zero-state copy; space completed-work summaries and progress presentation.
- KPI detail/sidebar/update-history/comment interactions, log/edit/delete-entry forms, remaining chart annotation accessibility text, and the remaining KPI cadence/formatting audit.
- Project-template selection, creation, lifecycle, and template project/task/discussion/Docs & Files flows.
- An exhaustive narrow-screen/expanded-translation visual review and app-level end-to-end workflow verification. The representative Storybook check is not a substitute for that remaining review.

## Delivery boundaries

- PR 7: backend-originated messages, including pass-through API errors, emails/digests, and server-rendered pages. Pass-through error strings are preserved; newly cataloged client-authored fallback/toast copy is included above.
- PR 8: complete Brazilian Portuguese coverage, terminology/native-speaker review, and ongoing coverage checks.
- PR 9: default language-selection rollout. The default-off flag and saved-language behavior are unchanged here.
- People directory and org-chart extraction remain separately tracked gaps.
