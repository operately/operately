defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
  query :get_goals, OperatelyWeb.Api.Queries.GetGoals
  query :get_goal, OperatelyWeb.Api.Queries.GetGoal
  query :get_activity, OperatelyWeb.Api.Queries.GetActivity
end
