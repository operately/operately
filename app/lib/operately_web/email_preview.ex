defmodule OperatelyWeb.EmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  use Plug.Router
  use OperatelyWeb.EmailPreview.Registry

  alias OperatelyWeb.EmailPreview.Previews.AssignmentsV2

  plug :match
  plug :dispatch

  group "assignments", module: AssignmentsV2 do
    preview :single, label: "Single Item"
    preview :simple
    preview :complete
  end

  get "/*_path" do
    OperatelyWeb.EmailPreview.Router.call(conn, __MODULE__)
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end
end
