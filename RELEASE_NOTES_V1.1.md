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

## 📋 Complete List of Changes

### Pull Requests (106 merged)
- [#3371](https://github.com/operately/operately/pull/3371)
- [#3369](https://github.com/operately/operately/pull/3369)
- [#3368](https://github.com/operately/operately/pull/3368)
- [#3367](https://github.com/operately/operately/pull/3367)
- [#3366](https://github.com/operately/operately/pull/3366)
- [#3365](https://github.com/operately/operately/pull/3365)
- [#3364](https://github.com/operately/operately/pull/3364)
- [#3363](https://github.com/operately/operately/pull/3363)
- [#3362](https://github.com/operately/operately/pull/3362)
- [#3361](https://github.com/operately/operately/pull/3361)
- [#3359](https://github.com/operately/operately/pull/3359)
- [#3358](https://github.com/operately/operately/pull/3358)
- [#3357](https://github.com/operately/operately/pull/3357)
- [#3356](https://github.com/operately/operately/pull/3356)
- [#3355](https://github.com/operately/operately/pull/3355)
- [#3354](https://github.com/operately/operately/pull/3354)
- [#3353](https://github.com/operately/operately/pull/3353)
- [#3352](https://github.com/operately/operately/pull/3352)
- [#3351](https://github.com/operately/operately/pull/3351)
- [#3350](https://github.com/operately/operately/pull/3350)
- [#3349](https://github.com/operately/operately/pull/3349)
- [#3348](https://github.com/operately/operately/pull/3348)
- [#3347](https://github.com/operately/operately/pull/3347)
- [#3345](https://github.com/operately/operately/pull/3345)
- [#3344](https://github.com/operately/operately/pull/3344)
- [#3343](https://github.com/operately/operately/pull/3343)
- [#3341](https://github.com/operately/operately/pull/3341)
- [#3339](https://github.com/operately/operately/pull/3339)
- [#3338](https://github.com/operately/operately/pull/3338)
- [#3337](https://github.com/operately/operately/pull/3337)
- [#3336](https://github.com/operately/operately/pull/3336)
- [#3335](https://github.com/operately/operately/pull/3335)
- [#3334](https://github.com/operately/operately/pull/3334)
- [#3332](https://github.com/operately/operately/pull/3332)
- [#3331](https://github.com/operately/operately/pull/3331)
- [#3330](https://github.com/operately/operately/pull/3330)
- [#3328](https://github.com/operately/operately/pull/3328)
- [#3327](https://github.com/operately/operately/pull/3327)
- [#3326](https://github.com/operately/operately/pull/3326)
- [#3325](https://github.com/operately/operately/pull/3325)
- [#3324](https://github.com/operately/operately/pull/3324)
- [#3323](https://github.com/operately/operately/pull/3323)
- [#3322](https://github.com/operately/operately/pull/3322)
- [#3321](https://github.com/operately/operately/pull/3321)
- [#3320](https://github.com/operately/operately/pull/3320)
- [#3318](https://github.com/operately/operately/pull/3318)
- [#3317](https://github.com/operately/operately/pull/3317)
- [#3316](https://github.com/operately/operately/pull/3316)
- [#3315](https://github.com/operately/operately/pull/3315)
- [#3314](https://github.com/operately/operately/pull/3314)
- [#3313](https://github.com/operately/operately/pull/3313)
- [#3312](https://github.com/operately/operately/pull/3312)
- [#3311](https://github.com/operately/operately/pull/3311)
- [#3310](https://github.com/operately/operately/pull/3310)
- [#3309](https://github.com/operately/operately/pull/3309)
- [#3308](https://github.com/operately/operately/pull/3308)
- [#3307](https://github.com/operately/operately/pull/3307)
- [#3306](https://github.com/operately/operately/pull/3306)
- [#3305](https://github.com/operately/operately/pull/3305)
- [#3304](https://github.com/operately/operately/pull/3304)
- [#3303](https://github.com/operately/operately/pull/3303)
- [#3302](https://github.com/operately/operately/pull/3302)
- [#3301](https://github.com/operately/operately/pull/3301)
- [#3300](https://github.com/operately/operately/pull/3300)
- [#3299](https://github.com/operately/operately/pull/3299)
- [#3298](https://github.com/operately/operately/pull/3298)
- [#3297](https://github.com/operately/operately/pull/3297)
- [#3296](https://github.com/operately/operately/pull/3296)
- [#3295](https://github.com/operately/operately/pull/3295)
- [#3294](https://github.com/operately/operately/pull/3294)
- [#3293](https://github.com/operately/operately/pull/3293)
- [#3292](https://github.com/operately/operately/pull/3292)
- [#3291](https://github.com/operately/operately/pull/3291)
- [#3290](https://github.com/operately/operately/pull/3290)
- [#3289](https://github.com/operately/operately/pull/3289)
- [#3288](https://github.com/operately/operately/pull/3288)
- [#3287](https://github.com/operately/operately/pull/3287)
- [#3286](https://github.com/operately/operately/pull/3286)
- [#3285](https://github.com/operately/operately/pull/3285)
- [#3284](https://github.com/operately/operately/pull/3284)
- [#3283](https://github.com/operately/operately/pull/3283)
- [#3282](https://github.com/operately/operately/pull/3282)
- [#3281](https://github.com/operately/operately/pull/3281)
- [#3280](https://github.com/operately/operately/pull/3280)
- [#3279](https://github.com/operately/operately/pull/3279)
- [#3278](https://github.com/operately/operately/pull/3278)
- [#3277](https://github.com/operately/operately/pull/3277)
- [#3276](https://github.com/operately/operately/pull/3276)
- [#3275](https://github.com/operately/operately/pull/3275)
- [#3274](https://github.com/operately/operately/pull/3274)
- [#3273](https://github.com/operately/operately/pull/3273)
- [#3271](https://github.com/operately/operately/pull/3271)
- [#3270](https://github.com/operately/operately/pull/3270)
- [#3269](https://github.com/operately/operately/pull/3269)
- [#3268](https://github.com/operately/operately/pull/3268)
- [#3267](https://github.com/operately/operately/pull/3267)
- [#3266](https://github.com/operately/operately/pull/3266)
- [#3265](https://github.com/operately/operately/pull/3265)
- [#3264](https://github.com/operately/operately/pull/3264)
- [#3263](https://github.com/operately/operately/pull/3263)
- [#3262](https://github.com/operately/operately/pull/3262)
- [#3261](https://github.com/operately/operately/pull/3261)
- [#3260](https://github.com/operately/operately/pull/3260)
- [#3259](https://github.com/operately/operately/pull/3259)
- [#3258](https://github.com/operately/operately/pull/3258)
- [#3257](https://github.com/operately/operately/pull/3257)
- [#3256](https://github.com/operately/operately/pull/3256)
- [#3255](https://github.com/operately/operately/pull/3255)
- [#3254](https://github.com/operately/operately/pull/3254)

### Issues (91 closed)
- [#3121](https://github.com/operately/operately/issues/3121)
- [#3360](https://github.com/operately/operately/issues/3360)
- [#3329](https://github.com/operately/operately/issues/3329)
- [#3184](https://github.com/operately/operately/issues/3184)
- [#3346](https://github.com/operately/operately/issues/3346)
- [#3342](https://github.com/operately/operately/issues/3342)
- [#3340](https://github.com/operately/operately/issues/3340)
- [#3131](https://github.com/operately/operately/issues/3131)
- [#3333](https://github.com/operately/operately/issues/3333)
- [#3173](https://github.com/operately/operately/issues/3173)
- [#2161](https://github.com/operately/operately/issues/2161)
- [#1980](https://github.com/operately/operately/issues/1980)
- [#2236](https://github.com/operately/operately/issues/2236)
- [#3020](https://github.com/operately/operately/issues/3020)
- [#1528](https://github.com/operately/operately/issues/1528)
- [#894](https://github.com/operately/operately/issues/894)
- [#1032](https://github.com/operately/operately/issues/1032)
- [#3319](https://github.com/operately/operately/issues/3319)
- [#3145](https://github.com/operately/operately/issues/3145)
- [#3214](https://github.com/operately/operately/issues/3214)
- [#2012](https://github.com/operately/operately/issues/2012)
- [#3239](https://github.com/operately/operately/issues/3239)
- [#3234](https://github.com/operately/operately/issues/3234)
- [#3272](https://github.com/operately/operately/issues/3272)
- [#3122](https://github.com/operately/operately/issues/3122)
- [#3241](https://github.com/operately/operately/issues/3241)
- [#3215](https://github.com/operately/operately/issues/3215)
- [#3235](https://github.com/operately/operately/issues/3235)
- [#2706](https://github.com/operately/operately/issues/2706)
- [#3146](https://github.com/operately/operately/issues/3146)
- [#2143](https://github.com/operately/operately/issues/2143)
- [#2382](https://github.com/operately/operately/issues/2382)
- [#2330](https://github.com/operately/operately/issues/2330)
- [#2180](https://github.com/operately/operately/issues/2180)
- [#2710](https://github.com/operately/operately/issues/2710)
- [#3009](https://github.com/operately/operately/issues/3009)
- [#3225](https://github.com/operately/operately/issues/3225)
- [#3223](https://github.com/operately/operately/issues/3223)
- [#2315](https://github.com/operately/operately/issues/2315)
- [#2381](https://github.com/operately/operately/issues/2381)
- [#3153](https://github.com/operately/operately/issues/3153)
- [#3207](https://github.com/operately/operately/issues/3207)
- [#3138](https://github.com/operately/operately/issues/3138)
- [#3159](https://github.com/operately/operately/issues/3159)
- [#3176](https://github.com/operately/operately/issues/3176)
- [#3061](https://github.com/operately/operately/issues/3061)
- [#3175](https://github.com/operately/operately/issues/3175)
- [#3193](https://github.com/operately/operately/issues/3193)
- [#3064](https://github.com/operately/operately/issues/3064)
- [#3188](https://github.com/operately/operately/issues/3188)
- [#1939](https://github.com/operately/operately/issues/1939)
- [#1714](https://github.com/operately/operately/issues/1714)
- [#1954](https://github.com/operately/operately/issues/1954)
- [#3155](https://github.com/operately/operately/issues/3155)
- [#3045](https://github.com/operately/operately/issues/3045)
- [#2705](https://github.com/operately/operately/issues/2705)
- [#2206](https://github.com/operately/operately/issues/2206)
- [#975](https://github.com/operately/operately/issues/975)
- [#3059](https://github.com/operately/operately/issues/3059)
- [#1777](https://github.com/operately/operately/issues/1777)
- [#2040](https://github.com/operately/operately/issues/2040)
- [#3140](https://github.com/operately/operately/issues/3140)
- [#3147](https://github.com/operately/operately/issues/3147)
- [#791](https://github.com/operately/operately/issues/791)
- [#687](https://github.com/operately/operately/issues/687)
- [#680](https://github.com/operately/operately/issues/680)
- [#655](https://github.com/operately/operately/issues/655)
- [#614](https://github.com/operately/operately/issues/614)
- [#422](https://github.com/operately/operately/issues/422)
- [#2519](https://github.com/operately/operately/issues/2519)
- [#1413](https://github.com/operately/operately/issues/1413)
- [#1516](https://github.com/operately/operately/issues/1516)
- [#1232](https://github.com/operately/operately/issues/1232)
- [#1206](https://github.com/operately/operately/issues/1206)
- [#1231](https://github.com/operately/operately/issues/1231)
- [#747](https://github.com/operately/operately/issues/747)
- [#675](https://github.com/operately/operately/issues/675)
- [#688](https://github.com/operately/operately/issues/688)
- [#628](https://github.com/operately/operately/issues/628)
- [#658](https://github.com/operately/operately/issues/658)
- [#598](https://github.com/operately/operately/issues/598)
- [#2834](https://github.com/operately/operately/issues/2834)
- [#3113](https://github.com/operately/operately/issues/3113)
- [#3124](https://github.com/operately/operately/issues/3124)
- [#3125](https://github.com/operately/operately/issues/3125)
- [#3123](https://github.com/operately/operately/issues/3123)
- [#3120](https://github.com/operately/operately/issues/3120)
- [#2580](https://github.com/operately/operately/issues/2580)
- [#3067](https://github.com/operately/operately/issues/3067)
- [#3044](https://github.com/operately/operately/issues/3044)
- [#2733](https://github.com/operately/operately/issues/2733)
- [#3030](https://github.com/operately/operately/issues/3030)

---

For detailed technical information, see the individual pull requests and issues linked in the [GitHub repository](https://github.com/operately/operately).