defmodule OperatelyWeb.Api.External do
  use TurboConnect.Api, default_source: :external

  defdelegate prepare_inputs(conn, inputs), to: OperatelyWeb.Api.RichContent.Preparation
  defdelegate prepare_response(conn, response), to: OperatelyWeb.Api.RichContent.Preparation

  plug(OperatelyWeb.Api.Plugs.RequireApiToken)
  plug(OperatelyWeb.Plugs.SetLocale)
  plug(OperatelyWeb.Api.Plugs.EnforceTokenAccessMode)

  use_types(OperatelyWeb.Api.Types)

  import OperatelyWeb.Api

  external_endpoints()
end
