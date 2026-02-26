defmodule OperatelyWeb.Api.External do
  use TurboConnect.Api

  plug(OperatelyWeb.Api.Plugs.RequireApiToken)
  plug(OperatelyWeb.Api.Plugs.EnforceTokenAccessMode)

  use_types(OperatelyWeb.Api.Types)

  import OperatelyWeb.Api

  external_endpoints()
end
