import { ReviewPage } from "..";

function getDynamicDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

function getOverdueDate(): string {
  return getDynamicDate(-Math.floor(Math.random() * 7) - 3); // 3-10 days ago
}

function getTodayDate(): string {
  return getDynamicDate(0);
}

function getYesterdayDate(): string {
  return getDynamicDate(-1);
}

export const mockMyWorkAssignments: ReviewPage.Assignment[] = [
  {
    resourceId: "goal-1",
    name: "Increase user engagement by 25%",
    due: getOverdueDate(),
    type: "goal",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/goals/goal-1",
  },
  {
    resourceId: "project-1",
    name: "Mobile App Redesign",
    due: getTodayDate(),
    type: "project",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/projects/project-1",
  },
  {
    resourceId: "goal-2",
    name: "Reduce customer churn to 5%",
    due: getYesterdayDate(),
    type: "goal",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/goals/goal-2",
  },
];

export const mockForReviewAssignments: ReviewPage.Assignment[] = [
  {
    resourceId: "check-in-1",
    name: "Q1 Marketing Campaign",
    due: getYesterdayDate(),
    type: "check_in",
    authorId: "user-2",
    authorName: "Jane Smith",
    path: "/projects/marketing-q1/check-ins/1",
  },
  {
    resourceId: "goal-update-1",
    name: "Revenue Growth Target",
    due: getOverdueDate(),
    type: "goal_update",
    authorId: "user-3",
    authorName: "Mike Johnson",
    path: "/goals/revenue-growth/updates/1",
  },
  {
    resourceId: "check-in-2",
    name: "Product Development Sprint",
    due: getYesterdayDate(),
    type: "check_in",
    authorId: "user-4",
    authorName: "Sarah Wilson",
    path: "/projects/product-dev/check-ins/2",
  },
];

export const mockSingleMyWorkAssignment: ReviewPage.Assignment[] = [
  {
    resourceId: "goal-single",
    name: "Complete quarterly objectives",
    due: getOverdueDate(),
    type: "goal",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/goals/quarterly-objectives",
  },
];

export const mockSingleForReviewAssignment: ReviewPage.Assignment[] = [
  {
    resourceId: "update-single",
    name: "Team Performance Review",
    due: getTodayDate(),
    type: "goal_update",
    authorId: "user-5",
    authorName: "Alex Brown",
    path: "/goals/team-performance/updates/1",
  },
];

export const mockOverdueAssignments: ReviewPage.Assignment[] = [
  {
    resourceId: "overdue-1",
    name: "Critical Bug Fix Project",
    due: getOverdueDate(),
    type: "project",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/projects/bug-fix",
  },
  {
    resourceId: "overdue-2",
    name: "Security Audit Goal",
    due: getOverdueDate(),
    type: "goal",
    authorId: "user-1",
    authorName: "John Doe",
    path: "/goals/security-audit",
  },
];
