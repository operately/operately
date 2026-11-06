defmodule OperatelyWeb.Api.ResourceHubs.Delete do
  @moduledoc "Deletes an empty space-owned Resource Hub. Documents, drafts, files, links, and folders must be removed first. The default Resource Hub cannot be deleted. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.ResourceHubDeleting
  alias Operately.ResourceHubs.ResourceHub

  inputs do
    field :resource_hub_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, hub} <- ResourceHub.get(me, id: inputs.resource_hub_id),
         {:ok, space} <- find_space(me, hub),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, _deleted} <- ResourceHubDeleting.run(me, hub) do
      {:ok, %{success: true}}
    else
      {:error, :not_empty} -> {:error, :bad_request, gettext("Only empty Resource Hubs can be deleted. Remove all documents, drafts, files, links, and folders first."), %{code: "resource_hub_not_empty"}}
      {:error, :default_hub} -> {:error, :bad_request, gettext("The default Resource Hub cannot be deleted."), %{code: "default_resource_hub_deletion_forbidden"}}
      {:error, _reason} = error -> error
    end
  end

  defp find_space(_me, %{space_id: nil}), do: {:error, :forbidden}
  defp find_space(me, hub), do: Group.get(me, id: hub.space_id)
end
