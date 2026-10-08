---
name: ui-copy
description: Use when writing, editing, reviewing, or replacing UI copy, UX writing, microcopy, button labels, link text, form labels, helper text, empty states, error messages, confirmation dialogs, onboarding text, notifications, or user-facing product wording.
---

# UI Copy

Write interface copy as part of the design, not as decoration after the layout is done. The product is speaking to someone who is trying to complete a task.

## Workflow

1. Identify the user's current goal, screen state, and likely concern.
2. Find nearby existing copy and match the product vocabulary, casing, tense, and tone.
3. Draft the clearest version first. Prefer plain, specific, task-oriented language over personality.
4. Tighten the copy until every word has a job.
5. Check that buttons, links, errors, and helper text set accurate expectations.
6. If changing existing copy, scan adjacent screens or components for terms that should stay consistent.

## Translation requirement

Use the [internationalization skill](../internationalization/SKILL.md) for the copy-change and new-language workflows.

Hardcoded system-authored, user-visible text is forbidden. Follow the [internationalization guide](../../../docs/internationalization.md) and its language glossaries for every copy change, including accessibility text, errors, notifications, activity feeds, exports, server-rendered pages, and email subjects and both body formats.

Use translation wrappers with literal message identifiers, complete sentences, named placeholders, language-aware plurals, and safe rich-text interpolation. Include translations for every supported language and run `make gen.i18n` in the same PR; never edit generated JSON manually or treat English fallback as completion. AI drafts must follow the glossary. Native-speaker review is recommended when available, but is optional; missing approval or review metadata is not itself a review finding or a blocker for translation, merge, or release.

User-authored content, machine identifiers/protocol fields, developer-only diagnostics/logs, and proper names needing no translation are exceptions. Diagnostics shown to users require translated presentation. The wording examples below illustrate copy choices; they must still use translation wrappers when implemented.

## Principles

- Treat words as UI. Real copy belongs in early designs, prototypes, and implementation; do not rely on placeholder text when the wording affects comprehension, trust, or layout.
- Clarity beats brevity and personality. Short is good only when it remains specific. Cute, clever, or branded wording is acceptable only after the action is unmistakable.
- Write for the user in this moment. Ask what they are trying to do, what they need to know now, what can wait, and whether they need reassurance.
- Be honest and concrete. Avoid marketing adjectives, hype, vague promises, and copy that tells users how to feel.
- Use plain language. Avoid jargon, unexplained acronyms, idioms, internal names, and technical error codes unless the user can act on them.
- Prefer active voice, present tense, and specific verbs: `Create`, `Save`, `Archive`, `Invite`, `Download`, `Connect`.
- Keep copy scannable. Use short sentences, front-load important words, and reveal advanced detail only when needed.
- Keep vocabulary consistent. Do not alternate between terms like `project`, `initiative`, and `workspace` unless the product treats them as different concepts.
- Match the platform and interaction. Use `tap` for touch surfaces and `click` only where pointer interaction is the assumption.
- Use humor sparingly. Never use humor in repetitive, high-friction, high-risk, error, payment, privacy, or destructive flows.

## Product Vocabulary

Some names exist only in code, schemas, and internal discussion. Never put them in UI copy — placeholders, labels, empty states, errors, confirmations, notifications, or help text.

- **Resource Hub** is an internal name. Users do not know what a resource hub is. Never use `resource hub`, `Resource Hub`, or similar phrasing in UI copy. Prefer the user-facing terms already in the product, such as `Documents & Files`, `documents and files`, or the specific item types (`document`, `folder`, `link`, `file`) when that is clearer.

## Buttons

Buttons should describe the action or outcome. A user should not be surprised by what happens after clicking.

- Prefer `Create project` over `Submit`.
- Prefer `Save and continue` over `Next` when the next step matters.
- Prefer `Delete task` and `Keep task` over `OK` and `Cancel` in destructive confirmations.
- Prefer `Complete payment` over `Continue` at payment completion.
- Avoid vague commitment language when a lower-pressure action is accurate. For example, `Get a quote` can feel clearer and less final than `Request pricing`.

Use short helper text near a high-commitment button when it answers a likely concern:

- `You will not be charged yet.`
- `You can change this later.`
- `Only workspace admins can see this.`

## Links

Links can carry more context than buttons, but they still need to be descriptive when scanned out of context.

- Prefer `View billing history` over `Learn more`.
- Prefer `Download the CSV report` over `Download`.
- Prefer `See workspace permissions` over `Details`.

Use `Learn more` only when the destination is genuinely broad and the surrounding heading already makes the topic obvious.

## States And Messages

For empty states, say what is missing and offer the next useful action:

- Weak: `No results.`
- Better: `No matching tasks. Try a different filter or create a task.`

For errors, explain what happened in user terms and give a recovery path:

- Weak: `System error #2234.`
- Better: `The password is incorrect. Try again or reset your password.`

For confirmations, name the object, consequence, and escape path:

- Weak: `Are you sure?`
- Better: `Delete "Q3 launch plan"? This removes the task for everyone.`

For success messages, confirm the completed action without hype:

- Weak: `Awesome! Your amazing update was successful.`
- Better: `Project updated.`

## Review Checklist

- Does the copy help the user complete the current task?
- Is the primary action named with a specific verb?
- Could the user understand it without reading surrounding body text?
- Is any word internal, technical, vague, promotional, or trying too hard?
- Is the tone appropriate for the situation's risk, friction, or emotion?
- Are terms, casing, and point of view consistent with nearby UI?
- Does implemented copy use translation wrappers and the glossary, with translations for all supported languages and regenerated resources?
- Is detail progressively disclosed instead of shown all at once?
- Does the copy still fit small screens and common localization expansion?

## Source Distillation

This skill distills principles from:

- Julie Chabin, `Good UI can't fix bad copy`
- John Zeratsky, `Five principles for great interface copywriting`
- Nick Babich, `16 Rules of Effective UX Writing`
- Tobias van Schneider, `Writing UX copy for buttons and links`
