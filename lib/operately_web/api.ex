defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
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
