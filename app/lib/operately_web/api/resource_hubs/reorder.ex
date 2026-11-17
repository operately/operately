defmodule OperatelyWeb.Api.ResourceHubs.Reorder do
  @moduledoc "Orders the Resource Hubs in a space. Supply every Resource Hub ID exactly once. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.ResourceHub

  inputs do
    field :space_id, :id, null: false
    field :resource_hub_ids, list_of(:id), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         :ok <- authorize_hubs(me, inputs.resource_hub_ids),
         {:ok, :ok} <- reorder(space, inputs.resource_hub_ids) do
      {:ok, %{success: true}}
    else
      {:error, :invalid_order} -> {:error, :bad_request, gettext("Include every Resource Hub exactly once when reordering."), %{code: "invalid_resource_hub_order"}}
      {:error, _reason} = error -> error
    end
  end

  defp authorize_hubs(me, ids) do
    ids = Enum.uniq(ids)
    hubs = ResourceHub.list(me, opts: [ids: ids])
    if length(hubs) == length(ids), do: :ok, else: {:error, :not_found}
  end

  defp reorder(space, ids) do
    Repo.transaction(fn ->
      with {:ok, current} <- Locking.lock_for_update(Repo, space) do
        hubs = Repo.all(from h in ResourceHub, where: h.space_id == ^current.id, order_by: h.id, lock: "FOR UPDATE")

        if Enum.sort(ids) != Enum.sort(Enum.map(hubs, & &1.id)), do: Repo.rollback(:invalid_order)

        by_id = Map.new(hubs, &{&1.id, &1})

        Enum.with_index(ids, fn id, position ->
          Map.fetch!(by_id, id) |> Ecto.Changeset.change(position: position) |> Repo.update!()
        end)

        :ok
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end
end
