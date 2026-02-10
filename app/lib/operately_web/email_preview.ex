defmodule OperatelyWeb.EmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  use Plug.Router
  use OperatelyWeb.EmailPreview.Registry

  alias OperatelyWeb.EmailPreview.Previews

  plug :match
  plug :dispatch

  group "assignments", module: Previews.AssignmentsV2 do
    preview :single, label: "Single Item"
    preview :simple
    preview :complete
  end

  group "project-champion-updating", module: Previews.ProjectChampionUpdating do
    preview :champion_removed
    preview :champion_assigned_to_you, label: "Assigned To You"
    preview :champion_assigned_to_teammate, label: "Assigned To Teammate"
  end

  group "project-check-in-submitted", module: Previews.ProjectCheckInSubmitted do
    preview :reviewer_acknowledge
    preview :teammate_view, label: "Team Member View"
    preview :no_reviewer
  end

  group "guest-invited", module: Previews.GuestInvited do
    preview :new_account, label: "New Account"
    preview :existing_account, label: "Existing Account"
  end

  group "company-member-added", module: Previews.CompanyMemberAdded do
    preview :preview
  end

  group "company-members-permissions-edited", module: Previews.CompanyMembersPermissionsEdited do
    preview :access_level_increased, label: "Access Level Increased"
    preview :access_level_decreased, label: "Access Level Decreased"
    preview :access_level_to_full, label: "Access Level To Full"
  end

  get "/*_path" do
    OperatelyWeb.EmailPreview.Router.call(conn, __MODULE__)
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end
end
