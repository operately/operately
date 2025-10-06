## Company Creator Onboarding Wizard Specification

### General Specification

- The onboarding wizard is designed to guide new company creators through the
  essential setup steps immediately after a company is created.

- It provides a structured, multi-step UI experience to help users configure
  their company profile, invite team members, and set initial goals.

- The wizard should be visually engaging, easy to follow, and allow users to
  skip steps or complete onboarding at any time.

- The component is intended for embedding in other flows and should be reusable
  for future onboarding scenarios.

- Only company creators (typically admins/owners) should see and interact with
  the onboarding wizard.

- The onboarding process should help ensure that companies are set up with all
  required information for successful use of the platform.

- The wizard should provide clear feedback, progress indication, and a welcoming
  experience for new users.

### UI Details

- The onboarding wizard component should display with a backdrop blur effect behind
  its main content, providing visual focus and separation from the underlying page.

- Define onboarding steps and flow (e.g., welcome, company info, invite team, set goals).

- Design UI/UX for wizard (multi-step, progress indicator, skip/complete options).

### Technical Specification

- UI implementation only: The onboarding wizard will be built as a reusable React
  component in the TurboUI library (`/turboui/src/`).

- No backend, data model, or API work in this scope.

- The component will not be a page, but a composable UI element for embedding in
  other flows.

- Storybook stories will be created in TurboUI to showcase and test the onboarding
  wizard component (`/turboui/src/OnboardingWizard/index.stories.tsx`)

- All design and interaction patterns should follow TurboUI conventions and leverage
  existing TurboUI primitives.

### Implementation Path

- The onboarding wizard component will be created at: `turboui/src/OnboardingWizard/index.tsx`
- Storybook stories for the component will be created at: `turboui/src/OnboardingWizard/index.tsx`

### Component Skeleton

```tsx
// turboui/src/OnboardingWizard/index.tsx

import React from "react";

export namespace OnboardingWizard {
  /**
   *
   * Data exposed when the user completes the wizard. The list of space
   * names entered by the user (deduplicated, trimmed, up to 10). If
   * the user skipped the step, this will be an empty array.
   *
   */
  export interface OnCompleteData {
    spaces: string[];
  }

  export interface Props {
    invitationLink: string;

    onComplete: (data: OnCompleteData) : void;
    onDismiss: () => void;
  }
}

export function OnboardingWizard(props: OnboardingWizard.Props) {
  return <div>{/* Wizard UI goes here */}</div>;
}
```

### Onboarding Steps (UI Flow)

1. **Welcome Screen**

   - Title: "Welcome to Operately"
   - Message from CEO/founder, profile image, and a friendly introduction.
   - Button: "Let's get started"

2. **Step 1: Set up spaces**

   - Title: "Set up spaces"
   - Description: Explain spaces as teams/departments.
   - Input: Text field for entering first spaces (e.g., Engineering, Marketing).
   - Actions: "Continue" and "Skip for now"

3. **Step 2: Invite teammates**

   - Title: "Invite teammates"
   - Description: Invite team to join workspace.
   - Input: Invitation link with copy button.
   - Actions: "Continue", "Skip for now", and "Back"

4. **Step 3: Create your first project**
   - Title: "Create your first project"
   - Description: Create a sample project to help users learn Operately.
   - Details: Show sample project info (goals, milestones, tasks, tips).
   - Actions: "Finish setup", "Skip for now", and "Back"

- Each step should match the provided mockups in layout, style, and interaction.
- Progress indicator (e.g., "Step 1 of 3") should be shown at the top of each step.
- All screens should use a backdrop blur for the modal background.

### Detailed Requirements

- Users can navigate back and forth between steps at any time.

- "Set up spaces" allows entering up to 10 space names, separated by
  commas. Input should be trimmed, deduplicated, and validated before creation.

- "Invite teammates" displays only the invitation link, which is instantly
  copyable and shareable.

- "Create your first project" creates a guided onboarding project; users
  cannot modify it during onboarding.

- Skipping any step immediately finishes the wizard; no summary is shown.

- All steps are optional; users can skip everything and still complete onboarding.

- Wizard progress is saved in local storage, allowing users to resume if interrupted.

- No help tooltips, videos, or documentation links are shown in the wizard.

- Transitions between steps should be simple, with no special animations.

- The wizard modal is always dismissible; users can close it at any time and
  will not be forced to complete onboarding.

### Space Name Validation & Filtering

- Empty strings and names containing only whitespace are ignored.
- All special characters are allowed; there are no restrictions on character set.
- Duplicate names (case-insensitive) are removed; only the first occurrence is kept.
- If the user enters the name "General" (case-insensitive), it is redacted and not included in the final list.
- Space names must be no more than 100 characters after trimming; longer names are ignored.
- No errors or warnings are shown to the user—invalid names are simply filtered out and not created.

### Accessibility

- The onboarding wizard modal and all controls must be fully keyboard-navigable.
- All interactive elements (buttons, inputs, links) should have clear focus states.
- The modal should trap focus while open and restore focus when closed.
- Provide appropriate ARIA roles and labels for modal, headings, and controls.
- Ensure screen reader compatibility for all content and navigation.
- Color contrast should meet WCAG AA standards.
- Dismiss and skip actions should be accessible via keyboard and screen reader.

### Mobile Responsiveness

- The onboarding wizard must be fully responsive and usable on mobile phones and tablets.
- All screens, controls, and content should adapt to smaller viewports without loss of functionality or clarity.
- Touch targets should be large enough for comfortable interaction.
- Modal layout, spacing, and font sizes should adjust for mobile screens.
- Navigation (next, back, skip, finish) must be easily accessible on mobile devices.
- Backdrop blur and visual effects should perform well on mobile browsers.

### Storybook Scenarios

- Create a Storybook story for each onboarding wizard screen:
  1. Welcome Screen
  2. Set up spaces
  3. Invite teammates
  4. Create your first project
- Each story should render the wizard in the corresponding step, with realistic mock data and props.
- Stories should demonstrate navigation (next, back, skip, finish) and show the backdrop blur effect.
- Add a story for the completed state (wizard finished or dismissed).
- Ensure stories are visually consistent with the provided mockups and cover all edge cases (e.g., skipping steps, entering maximum spaces).

### Welcome Screen Message

The first screen of the onboarding wizard should display the following message:

> **Thanks for joining Operately!**
>
> I'm thrilled to have you here. We built Operately to help teams work better together — to stay aligned, make progress visible, and keep everyone moving in the same direction.
>
> We'll walk you through a quick setup to get your workspace ready. It takes just a few minutes, and you can always come back to this later.
>
> _If you ever need help, reach out at support@operately.com — we're here for you._
>
> Best regards,
> **Marko Anastasov**
> CEO & Founder, Operately

### Welcome Screen Image

- The first screen should display the following profile image above the welcome message:
  - URL: `https://pbs.twimg.com/profile_images/1631277097246179330/IpGRsar1_400x400.jpg`
- The image should be shown in a circular frame, centered horizontally, and sized
  appropriately for both desktop and mobile screens.
- Alt text: `Marko Anastasov profile photo`
