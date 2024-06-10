defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
end
