## Company Member Onboarding Wizard Specification

### General Specification

- The company member onboarding wizard welcomes newly invited members as they join an existing company.
- It reuses the TurboUI onboarding modal pattern to create a focused, step-by-step experience tailored to non-admin users.
- The wizard guides the member through acknowledging the CEO’s welcome message, confirming their role, and setting a profile photo before entering the workspace.
- Only members who join through an invitation and have not yet completed onboarding should see this flow.
- Provide clear progress feedback, maintain a warm tone, and ensure the experience feels lightweight.

### UI Details

- Display the wizard as a modal with the same backdrop blur treatment used in existing TurboUI onboarding components.
- Present a three-step flow with a persistent progress indicator and navigation controls located consistently across steps.
- Steps and copy must align with product messaging for new members: welcome, role selection, profile photo.
- Include “Back” navigation where applicable and a “Finish” action only on the final step.

### Technical Specification

- UI-only scope implemented in the TurboUI library (`/turboui/src/`).
- Create a dedicated `OnboardingWizard` component that composes existing TurboUI primitives and aligns with the current onboarding wizard structure.
- No server or data layer changes are required; all inputs are managed locally and returned to the host via callbacks.
- Provide Storybook coverage for the member onboarding flow at `/turboui/src/OnboardingWizard/CompanyMemberOnboarding.stories.tsx`.
- Follow existing affordances for modal accessibility, focus management, and responsive layout.

### Implementation Path

- Place the component implementation at: `turboui/src/OnboardingWizard/CompanyMemberOnboarding.tsx`.
- Export typed callbacks for completion and dismissal, returning the selected role and avatar metadata.
- Create Storybook stories in: `turboui/src/OnboardingWizard/CompanyMemberOnboarding.stories.tsx`.

### Component Skeleton

```tsx
// turboui/src/OnboardingWizard/CompanyMemberOnboarding.tsx

import React from "react";

export namespace CompanyMemberOnboardingWizard {
  export interface OnCompleteData {
    /**
     * The role text the member selected or entered (trimmed).
     */
    role: string;

    /**
     * Metadata for the uploaded profile picture (filename, data URL, etc.).
     * The exact shape can mirror existing avatar upload components.
     */
    avatar: {
      id: string;
      name: string;
      url: string;
    } | null;
  }

export interface Props {
    onComplete: (data: OnCompleteData) => void;
    onDismiss: () => void;
    defaultRole?: string;
    initialAvatarUrl?: string;
  }
}

export function CompanyMemberOnboardingWizard(props: CompanyMemberOnboardingWizard.Props) {
  return <div>{/* Wizard UI goes here */}</div>;
}
```

### Onboarding Steps (UI Flow)

1. **Welcome Screen**

   - Title: “Welcome to Operately”
   - Display the CEO welcome message (see content below) with Marko’s profile photo.
   - Primary action: “Next”
   - Secondary action: “Skip for now” (dismisses the wizard and returns to the company dashboard).

2. **Step 1: Confirm your role**

   - Title: “What’s your role?”
   - Description: Briefly explain that the role helps teammates understand responsibilities.
   - Input: Autocomplete or free-form text field with placeholder “Software Engineer”.
   - Actions: “Back” and “Next”. “Next” remains enabled only when the input contains non-whitespace text.

3. **Step 2: Set your profile picture**
   - Title: “Add your profile picture”
   - Description: Encourage the member to upload or take a photo so teammates recognize them.
   - Controls: Avatar upload widget from TurboUI (drag-and-drop, file picker, replace/remove options).
   - Actions: “Back” and “Finish”. “Finish” is enabled once an image is selected and processed.

- On completion, call `onComplete` with the role and avatar data, then close the wizard.
- Dismissing or skipping does not call `onComplete`.

### Detailed Requirements

- Trim leading/trailing whitespace from the role before returning it. If the trimmed role is empty, prevent progression to the next step.
- Avatar uploads should reuse the existing TurboUI avatar uploader component and validation (file size, type restrictions). If no avatar is set, the user cannot finish the flow.
- The wizard must be responsive: maintain comfortable spacing, ensure readable typography, and scale imagery appropriately on mobile devices.
- No clipboard, invitation link, or project creation functionality is part of this flow.
- Errors (e.g., invalid file type) should surface via the shared uploader feedback patterns, not custom messaging.

### Mobile Responsiveness

- Optimize layouts for narrow screens by stacking content vertically and ensuring buttons remain thumb-friendly.
- The avatar upload control should accommodate touch interactions, including tapping to upload and removing an image.
- Maintain modal padding and typography adjustments to prevent text clipping or overflow.

### Storybook Scenarios

- Add stories covering each step with realistic props:
  1. Welcome Screen
  2. What is your role in the company?
  3. Set your profile picture (showing uploader with and without an image)
- Include a story illustrating the complete flow with mocked callbacks and prefilled data.
- Showcase edge cases such as validation on empty role input and disallowing finish without an avatar.
- Reuse decorators that provide the onboarding backdrop and modal framing so visuals match production.
