defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  # middleware OperatelyWeb.Api.Middleware.Authenticate

  # query :get_activities, OperatelyWeb.Api.Queries.GetActivities
end
