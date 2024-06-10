defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
  query :get_spaces, OperatelyWeb.Api.Queries.GetSpaces
  query :get_comments, OperatelyWeb.Api.Queries.GetComments
  query :get_tasks, OperatelyWeb.Api.Queries.GetTasks
  query :get_task, OperatelyWeb.Api.Queries.GetTask
  query :get_unread_notification_count, OperatelyWeb.Api.Queries.GetUnreadNotificationCount
  query :get_goal_check_ins, OperatelyWeb.Api.Queries.GetGoalCheckIns
  query :get_goal_check_in, OperatelyWeb.Api.Queries.GetGoalCheckIn
  query :get_groups, OperatelyWeb.Api.Queries.GetGroups
  query :get_group, OperatelyWeb.Api.Queries.GetGroup
  query :get_company, OperatelyWeb.Api.Queries.GetCompany
  query :get_milestone, OperatelyWeb.Api.Queries.GetMilestone
  query :get_project_check_in, OperatelyWeb.Api.Queries.GetProjectCheckIn
  query :get_discussions, OperatelyWeb.Api.Queries.GetDiscussions
  query :get_discussion, OperatelyWeb.Api.Queries.GetDiscussion
  query :get_key_resources, OperatelyWeb.Api.Queries.GetKeyResources
  query :search_project_contributor_candidates, OperatelyWeb.Api.Queries.SearchProjectContributorCandidates
  query :search_people, OperatelyWeb.Api.Queries.SearchPeople
  query :get_notifications, OperatelyWeb.Api.Queries.GetNotifications
  query :get_projects, OperatelyWeb.Api.Queries.GetProjects
  query :get_project, OperatelyWeb.Api.Queries.GetProject
  query :get_person, OperatelyWeb.Api.Queries.GetPerson
  query :get_people, OperatelyWeb.Api.Queries.GetPeople
  query :get_me, OperatelyWeb.Api.Queries.GetMe
  query :get_invitation, OperatelyWeb.Api.Queries.GetInvitation
  query :get_goals, OperatelyWeb.Api.Queries.GetGoals
  query :get_goal, OperatelyWeb.Api.Queries.GetGoal
  query :get_activity, OperatelyWeb.Api.Queries.GetActivity
end
