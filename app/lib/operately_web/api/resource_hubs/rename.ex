defmodule OperatelyWeb.Api.ResourceHubs.Rename do
  @moduledoc "Renames a space-owned Resource Hub."

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.ResourceHubs.{Permissions, ResourceHub}
  alias Operately.Operations.ResourceHubRenaming

  inputs do
    field :resource_hub_id, :id, null: false
    field :new_name, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:hub, fn ctx -> ResourceHub.get(ctx.me, id: inputs.resource_hub_id) end)
    |> run(:parent, fn ctx -> check_parent(ctx.hub) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.hub.request_info.access_level, :can_rename_hub, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubRenaming.run(ctx.me, ctx.hub, inputs.new_name) end)
    |> respond()
  end

  defp check_parent(%ResourceHub{space_id: space_id, project_id: nil, goal_id: nil}) when not is_nil(space_id), do: {:ok, :space}
  defp check_parent(_), do: {:error, :forbidden}

  defp respond({:ok, _}), do: {:ok, %{success: true}}
  defp respond({:error, :hub, _}), do: {:error, :not_found}
  defp respond({:error, :parent, _}), do: {:error, :forbidden}
  defp respond({:error, :permissions, _}), do: {:error, :forbidden}
  defp respond({:error, :operation, %{error: %Ecto.Changeset{}}}), do: {:error, :bad_request, gettext("Name is required"), %{field: "new_name"}}
  defp respond(_), do: {:error, :internal_server_error}
end
