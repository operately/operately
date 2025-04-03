# Operately Overview

## What is Operately?

Operately is an open source "startup operating system" designed to help companies run more effectively by connecting strategic goals with day-to-day execution. It serves as a comprehensive workspace where teams can track goals, manage projects, organize work, and collaborate efficiently—all in one place.

## Core Value Proposition

Operately helps companies "move fast and forward" by providing the structure and visibility needed to align teams, reduce communication overhead, and drive consistent execution. The platform replaces scattered tools and inconsistent processes with a unified system built on best practices.

## Key Features

### 1. Goals & OKRs

Operately helps teams track company-wide progress without relying on chaotic spreadsheets:

- Create and track goals at any level: company, team, or individual
- Link projects directly to goals so everyone sees how their work contributes
- Get automated progress updates instead of manually chasing status reports
- Set clear success criteria and timelines to keep teams focused

### 2. Project Management

The platform keeps projects on track with built-in best practices that guide teams to successful delivery:

- Organize work with flexible Kanban boards and clear milestones
- Define clear roles with project champions driving progress and reviewers ensuring quality
- Track work from planning to completion with visual boards
- Run consistent check-ins that maintain accountability
- Move conversations out of email into focused project discussions
- See all project resources, action items, and reviews in one place

### 3. Organized Workspaces

Operately gives teams and departments their own space where all their work lives together:

- "Spaces" keep goals, projects, and documents organized by department or team
- Add files and documentation that teams reference frequently
- Give teams autonomy while maintaining company-wide visibility
- Control access and sharing for sensitive information

### 4. Team Collaboration

The platform builds shared understanding across teams without requiring constant meetings:

- Replace scattered email threads with organized discussions
- Keep message boards focused on project topics
- Give everyone visibility into decisions and progress
- Keep context and documentation together where work happens
- Provide a single screen view of everything awaiting action or approval

## How Operately Works

Operately creates a connected work environment where:

1. Strategic company goals cascade down to team and individual objectives
2. Projects link directly to these goals, showing how daily work contributes to strategic priorities
3. Standardized project management practices guide teams through consistent execution
4. Progress is visible to everyone, reducing the need for status meetings
5. Information and context stay with the work, eliminating knowledge silos

## Target Users

Operately is particularly well-suited for:

- Startups and growing companies looking to implement systems and processes
- Organizations struggling with alignment between strategy and execution
- Teams that want to reduce meeting overhead while maintaining visibility
- Companies looking to standardize their approach to work management
- Teams transitioning from static spreadsheets, Notion documents, and disconnected collaboration tools to a unified platform that provides a framework for effective execution and follow-up

## Design Considerations

When creating new designs for Operately, consider these key principles:

1. **Simplicity and clarity**: Make complex work management concepts accessible and clear to diverse user groups

   - **For startup founders**, who are typically the ones who are evaluating and deciding on whether to adopt Operately: The product must be immediately intuitive with clear value proposition and ROI during evaluation. They need to see Operately as a tool that will remove work from their todo list, not add.
   - **For non-technical team members**: Interfaces should be approachable for people in departments such as Marketing, HR, Customer Success, and other non-technical roles who don't spend all day on computers.
   - Design for both groups simultaneously without compromising depth or usability

2. **Visibility**: Prioritize designs that create transparency and shared understanding

   - Create interfaces that naturally reveal progress, blockers, and dependencies
   - Design information hierarchies that give both high-level overviews and detailed drill-downs
   - Enable stakeholders to quickly assess status without requiring lengthy reports or meetings

3. **Connection**: Emphasize the relationships between goals, projects, and tasks

   - Visually demonstrate how daily work connects to higher-level company objectives
   - Make these connections obvious and traceable in both directions (top-down and bottom-up)
   - Design navigation that reinforces the context of how different work components relate
   - Create **product loops** that ensure features are interconnected rather than isolated - for example, milestones should appear in personal profiles, company accomplishments, or AI-generated summaries rather than existing in isolation
   - Every feature should provide value in multiple contexts, creating feedback loops that reinforce usage

4. **Standardization**: Support consistent processes while allowing for flexibility

   - Create templates and frameworks that encourage best practices without being rigid
   - Design interfaces that guide users toward consistent workflows while accommodating different team needs
   - Balance the need for organization-wide consistency with team-specific customization
   - Use familiar UI patterns that feel intuitive to non-technical users - avoid creating custom widgets or novel UI elements that require learning
   - The product should feel new but familiar, leveraging established interface design patterns that users already understand

5. **Reduced friction**: Minimize the work required to keep information updated

   - Design for passive data collection wherever possible (capturing information as a byproduct of work)
   - Prioritize quick, meaningful updates over detailed documentation
   - Create natural moments for reflection and update within existing workflows

6. **Proactive Operations**: Design with the vision of eventually replacing human operational overhead
   - Create systems that can evolve from passive recording to active enforcement of organizational discipline
   - Design data structures and workflows that can be enhanced with AI to proactively manage operations
   - Consider how each feature could be elevated from human-initiated to system-initiated with the right intelligence
   - Build interfaces that can gracefully transition from human-driven to AI-assisted to fully autonomous
   - Support the long-term vision of Operately replacing the need for a Chief Operating Officer in startups and scale-ups

## Visual Identity Guidelines

Operately has a defined design system that maintains visual consistency across the application. When creating designs:

1. **Reference the design system** located in `/src/pages/design-system` which contains examples and usage guidelines for all UI components

2. **Review component implementations** in `/src/components` to understand how elements are built

3. **See the application in action** via the quick tour at https://operately.com/help/quick-tour/ which provides key screenshots showing the current implementation and visual aesthetic

4. **Note key design elements**:
   - Semantic color naming based on usage (surface, content, interaction colors)
   - Clean typography system with consistent hierarchies
   - Standardized component patterns (buttons, avatars, callouts, etc.)

The design system is comprehensive and should be the primary reference for visual design decisions to ensure consistency with the existing application.

5. **When extending beyond the design system**:
   - If a new UI element or pattern is needed that isn't in the design system, prioritize familiar UI patterns that users will immediately understand
   - New components should feel consistent with the existing design language while solving the new use case
   - Avoid creating novel interaction patterns that require learning – instead, adapt established UI conventions when possible
   - Innovation should focus on solving user problems rather than reinventing standard UI elements

## Design Success Metrics

When evaluating designs for Operately, consider these key success criteria:

1. **Immediate comprehension**: Non-technical users should understand a feature's purpose and operation on first glance

2. **Strategic alignment**: Designs should clearly support the vision of connecting strategy to execution

3. **Value demonstration**: The value proposition should be immediately apparent to startup founders evaluating the product

4. **Implementation feasibility**: Designs should be technically feasible to implement with the existing frontend stack (React, Tailwind CSS, Radix UI components, Tabler icons) and align with the current development approach

5. **Consistency**: New designs should maintain visual and interaction consistency with the rest of the application

6. **Progressive enhancement**: Designs should work without AI capabilities today but be structured to leverage AI as those capabilities are developed

7. **Mobile responsiveness**: All designs must be fully responsive from the start, ensuring a seamless experience across all devices, with the understanding that:
   - Desktop is the primary platform (90% of usage)
   - Mobile and tablet interfaces should prioritize reading content and quick interactions (commenting, status updates, approvals)
   - Complex creation and editing workflows can focus on desktop optimization while maintaining basic functionality on smaller devices.

## Current Status

Operately is an open source project currently in beta. The team is actively working on major new features and improvements based on user feedback.
