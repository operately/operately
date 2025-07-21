import * as Types from "../types";

/**
 * Applies a list of filter conditions to a task array
 * @param tasks - Array of tasks to filter
 * @param filters - Array of filter conditions to apply
 * @returns Filtered array of tasks
 */
export function applyFilters(tasks: Types.Task[], filters: Types.FilterCondition[]): Types.Task[] {
  if (filters.length === 0) {
    return tasks;
  }

  return tasks.filter(task => {
    // All filters must pass (AND logic)
    return filters.every(filter => applyFilter(task, filter));
  });
}

/**
 * Applies a single filter condition to a task
 * @param task - Task to check against the filter
 * @param filter - Filter condition to apply
 * @returns True if task matches the filter condition
 */
function applyFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  switch (filter.type) {
    case "status":
      return applyStatusFilter(task, filter);
    case "assignee":
      return applyAssigneeFilter(task, filter);
    case "creator":
      return applyCreatorFilter(task, filter);
    case "milestone":
      return applyMilestoneFilter(task, filter);
    case "content":
      return applyContentFilter(task, filter);
    case "due_date":
      return applyDateFilter(task.dueDate?.date, filter);
    case "created_date":
    case "updated_date":
    case "started_date":
    case "completed_date":
      // These date fields are not available in the current Task interface
      // Return true to pass all tasks for these filter types
      return true;
    default:
      return true; // Unknown filter types pass by default
  }
}

/**
 * Applies status filter to a task
 */
function applyStatusFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  const taskStatus = task.status;
  const filterValue = filter.value as Types.Status;

  switch (filter.operator) {
    case "is":
      return taskStatus === filterValue;
    case "is_not":
      return taskStatus !== filterValue;
    default:
      return true;
  }
}

/**
 * Applies assignee filter to a task
 */
function applyAssigneeFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  const taskAssignees = task.assignees || [];
  const filterValue = filter.value;

  if (!filterValue) return true;

  switch (filter.operator) {
    case "is":
      return taskAssignees.some(assignee => assignee.id === filterValue.id);
    case "is_not":
      return !taskAssignees.some(assignee => assignee.id === filterValue.id);
    default:
      return true;
  }
}

/**
 * Applies creator filter to a task
 */
function applyCreatorFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  // Creator field is not available in the current Task interface
  // For now, we'll use the first assignee as a proxy for creator
  // In a real implementation, this would use a proper creator field
  const taskCreator = task.assignees?.[0];
  const filterValue = filter.value;

  if (!filterValue) return true;
  if (!taskCreator) return filter.operator === "is_not";

  switch (filter.operator) {
    case "is":
      return taskCreator.id === filterValue.id;
    case "is_not":
      return taskCreator.id !== filterValue.id;
    default:
      return true;
  }
}

/**
 * Applies milestone filter to a task
 */
function applyMilestoneFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  const taskMilestone = task.milestone;
  const filterValue = filter.value;

  switch (filter.operator) {
    case "is":
      if (!filterValue) {
        // Filter for "no milestone"
        return !taskMilestone;
      }
      return taskMilestone?.id === filterValue.id;
    case "is_not":
      if (!filterValue) {
        // Filter for "not no milestone" (has milestone)
        return !!taskMilestone;
      }
      return taskMilestone?.id !== filterValue.id;
    default:
      return true;
  }
}

/**
 * Applies content filter to a task
 */
function applyContentFilter(task: Types.Task, filter: Types.FilterCondition): boolean {
  const searchTerm = (filter.value as string)?.toLowerCase() || "";
  
  if (!searchTerm) return true;

  const taskTitle = task.title?.toLowerCase() || "";
  const taskDescription = task.description?.toLowerCase() || "";

  switch (filter.operator) {
    case "contains":
      return taskTitle.includes(searchTerm) || taskDescription.includes(searchTerm);
    case "does_not_contain":
      return !taskTitle.includes(searchTerm) && !taskDescription.includes(searchTerm);
    default:
      return true;
  }
}

/**
 * Applies date filter to a date field
 */
function applyDateFilter(taskDate: Date | null | undefined, filter: Types.FilterCondition): boolean {
  const filterValue = filter.value;
  
  if (!filterValue) return true;
  if (!taskDate) return false;

  const taskDateObj = new Date(taskDate);
  const filterDateObj = new Date(filterValue);

  switch (filter.operator) {
    case "before":
      return taskDateObj < filterDateObj;
    case "after":
      return taskDateObj > filterDateObj;
    case "between":
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const startDate = new Date(filterValue[0]);
        const endDate = new Date(filterValue[1]);
        return taskDateObj >= startDate && taskDateObj <= endDate;
      }
      return true;
    default:
      return true;
  }
}