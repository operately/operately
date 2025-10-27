defmodule OperatelyWeb.EmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  use Plug.Router
  use OperatelyWeb.EmailPreview.Registry

  alias OperatelyWeb.EmailPreview.Previews.AssignmentsV2
  alias OperatelyWeb.EmailPreview.Previews.ProjectChampionUpdating
  alias OperatelyWeb.EmailPreview.Previews.ProjectCheckInSubmitted

  plug :match
  plug :dispatch

  group "assignments", module: AssignmentsV2 do
    preview :single, label: "Single Item"
    preview :simple
    preview :complete
  end

  group "project-champion-updating", module: ProjectChampionUpdating do
    preview :champion_removed, label: "Champion Removed"
    preview :champion_assigned_to_you, label: "Assigned To You"
    preview :champion_assigned_to_teammate, label: "Assigned To Teammate"
  end

  group "project-check-in-submitted", module: ProjectCheckInSubmitted do
    preview :reviewer_acknowledge, label: "Reviewer Acknowledge"
    preview :teammate_view, label: "Team Member View"
    preview :no_reviewer, label: "No Reviewer Assigned"
  end

  get "/*_path" do
    OperatelyWeb.EmailPreview.Router.call(conn, __MODULE__)
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end
end
