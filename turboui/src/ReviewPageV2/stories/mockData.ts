import { ReviewPageV2 } from "..";

function getDateOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

// Project Origins
const mobileAppLaunch: ReviewPageV2.AssignmentOrigin = {
  id: "project-mobile-app",
  name: "Mobile App Launch",
  type: "project",
  path: "/projects/mobile-app",
  spaceName: "Product",
  dueDate: getDateOffset(18),
};

const websiteRedesign: ReviewPageV2.AssignmentOrigin = {
  id: "project-website-redesign",
  name: "Website Redesign",
  type: "project",
  path: "/projects/website-redesign",
  spaceName: "Marketing",
  dueDate: getDateOffset(25),
};

const q4Planning: ReviewPageV2.AssignmentOrigin = {
  id: "project-q4-planning",
  name: "Q4 Planning Initiative",
  type: "project",
  path: "/projects/q4-planning",
  spaceName: "Operations",
  dueDate: getDateOffset(35),
};

// Goal Origins
const customerSatisfaction: ReviewPageV2.AssignmentOrigin = {
  id: "goal-customer-satisfaction",
  name: "Improve Customer Satisfaction",
  type: "goal",
  path: "/goals/customer-satisfaction",
  spaceName: "Customer Success",
  dueDate: getDateOffset(45),
};

const teamProductivity: ReviewPageV2.AssignmentOrigin = {
  id: "goal-team-productivity",
  name: "Increase Team Productivity",
  type: "goal",
  path: "/goals/team-productivity",
  spaceName: "Engineering",
  dueDate: getDateOffset(60),
};

const retentionPlaybook: ReviewPageV2.AssignmentOrigin = {
  id: "project-retention-playbook",
  name: "Retention Playbook Refresh",
  type: "project",
  path: "/projects/retention-playbook",
  spaceName: "Customer Success",
  dueDate: getDateOffset(7),
};

const engagementGoal: ReviewPageV2.AssignmentOrigin = {
  id: "goal-engagement-growth",
  name: "Boost Customer Engagement",
  type: "goal",
  path: "/goals/customer-engagement",
  spaceName: "Marketing",
  dueDate: getDateOffset(9),
};

export const dueSoonAssignments: ReviewPageV2.Assignment[] = [
  // Overdue items
  {
    resourceId: "milestone-mobile-beta",
    name: "Mobile App Beta Release",
    due: getDateOffset(-3),
    type: "milestone",
    role: "owner",
    actionLabel: "Beta release",
    path: "/projects/mobile-app/milestones/beta-release",
    origin: mobileAppLaunch,
    taskStatus: null,
  },
  {
    resourceId: "task-security-audit",
    name: "Complete security audit",
    due: getDateOffset(-1),
    type: "project_task",
    role: "owner",
    actionLabel: "Get hard copy of security audit",
    path: "/projects/mobile-app/tasks/security-audit",
    origin: mobileAppLaunch,
    taskStatus: "in_progress",
  },
  // Due today
  {
    resourceId: "check-in-mobile-app",
    name: "Mobile App Launch – Week 8 update",
    due: getDateOffset(0),
    type: "check_in",
    role: "owner",
    actionLabel: "Submit project check-in",
    path: "/projects/mobile-app/check-ins/8",
    origin: mobileAppLaunch,
    taskStatus: null,
  },
  {
    resourceId: "goal-update-customer-satisfaction",
    name: "Customer Satisfaction Goal Update",
    due: getDateOffset(0),
    type: "goal_update",
    role: "owner",
    actionLabel: "Submit goal check-in",
    path: "/goals/customer-satisfaction/updates/latest",
    origin: customerSatisfaction,
    taskStatus: null,
  },
  // Due soon
  {
    resourceId: "task-qa-test-plan",
    name: "Finalize QA test plan",
    due: getDateOffset(2),
    type: "project_task",
    role: "owner",
    actionLabel: "Finalize QA test plan",
    path: "/projects/mobile-app/tasks/qa-plan",
    origin: mobileAppLaunch,
    taskStatus: "in_progress",
  },
  {
    resourceId: "task-design-system",
    name: "Document design system",
    due: getDateOffset(1),
    type: "project_task",
    role: "owner",
    actionLabel: "Document design system",
    path: "/projects/website-redesign/tasks/design-system",
    origin: websiteRedesign,
    taskStatus: "todo",
  },
  {
    resourceId: "milestone-website-mvp",
    name: "Website MVP Launch",
    due: getDateOffset(3),
    type: "milestone",
    role: "owner",
    actionLabel: "Launch website MVP",
    path: "/projects/website-redesign/milestones/mvp",
    origin: websiteRedesign,
    taskStatus: null,
  },
];

export const reviewAssignments: ReviewPageV2.Assignment[] = [
  {
    resourceId: "check-in-review-retention",
    name: "Retention Playbook – Week 5 check-in",
    due: getDateOffset(-2),
    type: "check_in",
    role: "reviewer",
    actionLabel: "Review project check-in",
    path: "/projects/retention-playbook/check-ins/5",
    origin: retentionPlaybook,
    authorId: "user-123",
    authorName: "Sarah Chen",
    taskStatus: null,
  },
  {
    resourceId: "goal-update-review-engagement",
    name: "Customer Engagement Goal Update",
    due: getDateOffset(-1),
    type: "goal_update",
    role: "reviewer",
    actionLabel: "Review goal check-in",
    path: "/goals/customer-engagement/updates/latest",
    origin: engagementGoal,
    authorId: "user-456",
    authorName: "Alex Rodriguez",
    taskStatus: null,
  },
  {
    resourceId: "check-in-review-retention-dependencies",
    name: "Retention Playbook – Dependencies review",
    due: getDateOffset(0),
    type: "project_task",
    role: "reviewer",
    actionLabel: "Share with the team",
    path: "/projects/retention-playbook/check-ins/dependencies",
    origin: retentionPlaybook,
    authorId: "user-789",
    authorName: "Maria Garcia",
    taskStatus: null,
  },
];

export const upcomingAssignments: ReviewPageV2.Assignment[] = [
  {
    resourceId: "task-beta-feedback",
    name: "Compile beta feedback summary",
    due: getDateOffset(6),
    type: "project_task",
    role: "owner",
    actionLabel: "Compile beta feedback summary",
    path: "/projects/mobile-app/tasks/beta-feedback",
    origin: mobileAppLaunch,
    taskStatus: "pending",
  },
  {
    resourceId: "task-launch-playbook",
    name: "Review launch day playbook",
    due: getDateOffset(10),
    type: "project_task",
    role: "owner",
    actionLabel: "Review launch day playbook",
    path: "/projects/mobile-app/tasks/launch-playbook",
    origin: mobileAppLaunch,
    taskStatus: "pending",
  },
  {
    resourceId: "task-content-migration",
    name: "Migrate existing content to new design",
    due: getDateOffset(12),
    type: "project_task",
    role: "owner",
    actionLabel: "Migrate existing content",
    path: "/projects/website-redesign/tasks/content-migration",
    origin: websiteRedesign,
    taskStatus: "pending",
  },
  {
    resourceId: "milestone-q4-kickoff",
    name: "Q4 Planning Kickoff",
    due: getDateOffset(15),
    type: "milestone",
    role: "owner",
    actionLabel: "Launch Q4 planning",
    path: "/projects/q4-planning/milestones/kickoff",
    origin: q4Planning,
    taskStatus: null,
  },
  {
    resourceId: "goal-update-team-productivity",
    name: "Team Productivity Goal Update",
    due: getDateOffset(20),
    type: "goal_update",
    role: "owner",
    actionLabel: "Submit goal progress update",
    path: "/goals/team-productivity/updates/next",
    origin: teamProductivity,
    taskStatus: null,
  },
  {
    resourceId: "task-analytics-setup",
    name: "Set up analytics tracking",
    due: getDateOffset(25),
    type: "project_task",
    role: "owner",
    actionLabel: "Set up analytics tracking",
    path: "/projects/website-redesign/tasks/analytics-setup",
    origin: websiteRedesign,
    taskStatus: "pending",
  },
];

export const allAssignments: ReviewPageV2.Assignment[] = [
  ...dueSoonAssignments,
  ...reviewAssignments,
  ...upcomingAssignments,
];

export const emptyStateAssignments: ReviewPageV2.Assignment[] = [];

export const smallPlateDueSoon: ReviewPageV2.Assignment[] = dueSoonAssignments.slice(0, 2);

export const smallPlateReview: ReviewPageV2.Assignment[] = reviewAssignments.slice(0, 1);

export const taskOnlyDueSoon: ReviewPageV2.Assignment[] = [
  {
    resourceId: "task-copy-refresh",
    name: "Refresh onboarding copy",
    due: getDateOffset(-1),
    type: "project_task",
    role: "owner",
    actionLabel: "Refresh onboarding copy",
    path: "/projects/mobile-app/tasks/onboarding-copy",
    origin: mobileAppLaunch,
    taskStatus: "in_progress",
    description: null,
  },
  {
    resourceId: "task-crm-audit",
    name: "Audit CRM automations",
    due: getDateOffset(0),
    type: "project_task",
    role: "owner",
    actionLabel: "Audit CRM automations",
    path: "/projects/mobile-app/tasks/crm-audit",
    origin: mobileAppLaunch,
    taskStatus: "todo",
    description: null,
  },
];
