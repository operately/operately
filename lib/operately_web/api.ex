defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  use_types OperatelyWeb.Api.Types

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
end
