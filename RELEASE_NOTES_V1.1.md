# Operately Version 1.1 Release Notes

## Overview

Version 1.1 represents a significant evolution of Operately since the V1.0.0 release on July 28, 2025. This release includes **106 merged pull requests** and addresses **91 closed issues**, delivering substantial improvements to AI capabilities, task management, user experience, and overall platform stability.

## 🚀 Major New Features

### AI Assistant Enhancements (Alfred)
- **Copy AI Responses**: Added one-click copy functionality for AI responses in the sidebar
- **Experimental AI Prompts**: Support for experimental AI features with dedicated badging
- **Fresh Context Access**: AI can now get up-to-date goal and project information during conversations
- **Context-Aware Conversations**: AI sidebar now shows only conversations relevant to the current project/goal
- **User Avatars in AI Chat**: Replaced "you" with actual user avatars in AI conversations
- **Loading Indicators**: Added spinner animations while waiting for AI responses

### Task Management System
- **Task Board**: Complete task management interface with milestone organization
- **Drag & Drop**: Full drag-and-drop support for task reordering and milestone assignment
- **Task Status Management**: Comprehensive task status tracking and updates
- **Due Date Support**: Task due dates with contextual date selection (Q2, May, specific dates)
- **Contributor-Based Assignment**: Task assignment limited to project contributors
- **Milestone Integration**: Tasks organized by milestones with proper completion tracking

### Document Management
- **Document Sorting**: Sort documents by name, date created, or date modified
- **Auto-Focus**: Title field automatically focused when creating new documents
- **File Attachment**: Improved file attachment system via toolbar
- **Resource Favicon Support**: Automatic favicon extraction for external resource links

## 📈 Improvements and Enhancements

### Goal & Project Management
- **Goal Start Dates**: Start date tracking for better timeline visibility
- **Goal Checklists**: Checklist support for goal success conditions
- **Quick Add in Work Map**: Rapid goal and project creation directly from work map
- **Project Creation from Goals**: Direct project creation from goal pages
- **Goal Status Improvements**: Better status copy and validation for goal states
- **Enhanced Goal Closing**: Improved warnings and validation for closing goals

### User Experience
- **Dark Mode Fixes**: Comprehensive dark mode improvements across components
- **Avatar Size Improvements**: Larger, more visible avatars in rich text and mentions
- **Loading State Improvements**: Better loading indicators throughout the application
- **Auto-Focus Enhancements**: Improved focus management in forms and inputs
- **Work Map Table View**: Alternative table-based view for goal hierarchies
- **Personal Work Views**: Tailored views for individual vs. company-wide work

### Email & Notifications
- **Organization Names in Emails**: Email subjects now include organization names
- **Daily Assignment Emails**: Improved formatting with organization context
- **SMTP Testing**: End-to-end email delivery testing infrastructure
- **Email Template Improvements**: Better Gmail compatibility and formatting

### Admin & Management
- **Active Organizations Screen**: Admin panel for viewing and managing active organizations
- **Admin Analytics**: Better insights into organization usage and activity
- **Review System Improvements**: Enhanced review workflows and notifications

## 🐛 Bug Fixes and Stability

### Core Functionality
- **Activity Feed Errors**: Fixed broken activity feeds with missing relations
- **Closed Project Filtering**: Resolved issues with closed projects appearing in active lists
- **Goal Target Validation**: Prevent saving targets with equal 'from' and 'to' values
- **Project Timeline Issues**: Fixed timeline editing and display problems
- **Notification Count Accuracy**: Corrected false notification indicators
- **Milestone Display**: Fixed milestone visibility and completion states

### User Interface
- **Input Field Transparency**: Fixed transparent milestone input fields
- **Avatar Overflow**: Resolved avatar list overflow on project pages
- **Status Selector Dark Mode**: Fixed white search inputs in dark mode
- **Checkbox Styling**: Improved checkbox appearance in dark mode
- **Form Validation**: Better error handling and validation messages

### Data Integrity
- **Demo Organization Data**: Updated demo data to match new activity schema
- **Background Job Processing**: Improved Oban job error handling and monitoring
- **Database Migration**: Switched from Bamboo to Swoosh for better email delivery
- **Reaction System**: Added ability to undo/remove reactions

## 🛠 Developer Experience

### Testing & Quality
- **Test Factory System**: Comprehensive test factory system for better test maintainability
- **SMTP End-to-End Testing**: Mailhog integration for email delivery testing
- **TypeScript Linting**: Mandatory TypeScript compilation checks before submission
- **Flaky Test Fixes**: Resolved various intermittent test failures

### Development Tools
- **Agent Instructions**: Comprehensive agent instructions for consistent development
- **PR Naming Enforcement**: Strict PR title format validation
- **Code Quality Checks**: Enhanced linting and formatting requirements
- **Build Process Improvements**: Optimized build and dependency management

### Infrastructure
- **Sentry Integration**: Improved error tracking and monitoring
- **CI/CD Enhancements**: Better continuous integration workflows
- **License Compliance**: Automated license checking and compliance

## 📊 Statistics

- **106** Pull Requests Merged
- **91** Issues Closed
- **Multiple Contributors** across various areas
- **Comprehensive Test Coverage** additions
- **Zero Breaking Changes** for existing users

## 🔄 Migration Notes

### From V1.0.0 to V1.1.0

1. **Database Migrations**: Standard migration process applies
2. **Email Configuration**: New Swoosh-based email system (automatic migration)
3. **Feature Flags**: New experimental AI features controlled by organization settings
4. **UI Changes**: Minor interface improvements may affect custom styles

### Update Command
```bash
# Update Docker image version
# From: operately/operately:v1.0.0
# To: operately/operately:v1.1.0

docker compose run --rm app sh -c "/app/bin/migrate"
docker compose up --wait --detach
```

## 🎯 Looking Forward

Version 1.1 establishes a strong foundation for advanced AI capabilities, comprehensive task management, and improved user experience. The next releases will continue to expand AI functionality, enhance collaboration features, and improve performance.

## 🙏 Acknowledgments

Thanks to all contributors who made this release possible, including core team members and community contributors. Special recognition for the extensive testing and feedback that helped ensure quality and stability.

---

For detailed technical information, see the individual pull requests and issues linked in the [GitHub repository](https://github.com/operately/operately).