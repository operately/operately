defmodule OperatelyWeb.Api.ResourceHubs.Create do
  @moduledoc "Creates a space-owned Resource Hub at the end of the list. Preserves the space's default Resource Hub. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.ResourceHubCreating
  alias Operately.ResourceHubs.Summary

  inputs do
    field :space_id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :hub, :resource_hub_summary, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, hub} <- ResourceHubCreating.run(me, space, %{name: String.trim(inputs.name), description: %{}}) do
      {:ok, %{hub: Serializer.serialize(Summary.build(hub, space.default_resource_hub_id))}}
    else
      {:error, _step, %Ecto.Changeset{}, _changes} -> {:error, :bad_request, gettext("Name is required"), %{field: "name"}}
      {:error, _step, :not_found, _changes} -> {:error, :not_found}
      {:error, _step, _reason, _changes} -> {:error, :internal_server_error}
      {:error, _reason} = error -> error
    end
  end
end
