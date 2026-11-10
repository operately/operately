defmodule OperatelyWeb.Api.Tasks.ReorderBoards do
  @moduledoc "Orders the active task boards in a space. Supply every active task board ID exactly once. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Repo.Locking
  alias Operately.Tasks.TaskBoard

  inputs do
    field :space_id, :id, null: false
    field :board_ids, list_of(:id), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         :ok <- authorize_boards(me, inputs.board_ids),
         {:ok, :ok} <- reorder(space, inputs.board_ids) do
      {:ok, %{success: true}}
    else
      {:error, :invalid_order} -> {:error, :bad_request, gettext("Include every active task board exactly once when reordering."), %{code: "invalid_task_board_order"}}
      {:error, _reason} = error -> error
    end
  end

  defp authorize_boards(me, ids) do
    ids = Enum.uniq(ids)
    boards = TaskBoard.list(me, opts: [ids: ids])
    if length(boards) == length(ids), do: :ok, else: {:error, :not_found}
  end

  defp reorder(space, ids) do
    Repo.transaction(fn ->
      with {:ok, current} <- Locking.lock_for_update(Repo, space) do
        boards = Repo.all(from b in TaskBoard, where: b.space_id == ^current.id and is_nil(b.archived_at), order_by: b.id, lock: "FOR UPDATE")

        if Enum.sort(ids) != Enum.sort(Enum.map(boards, & &1.id)), do: Repo.rollback(:invalid_order)

        by_id = Map.new(boards, &{&1.id, &1})

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
