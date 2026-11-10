defmodule OperatelyWeb.Api.Tasks.CreateBoard do
  @moduledoc "Creates a task board at the end of the space's active boards without changing the default. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Tasks.BoardSummary

  inputs do
    field :space_id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :board, :task_board_summary, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, board} <- Operately.Operations.TaskBoardCreating.run(me, space, inputs.name) do
      {:ok, %{board: Serializer.serialize(BoardSummary.build(board, space.default_task_board_id))}}
    else
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request, gettext("Name is required"), %{field: "name"}}
      {:error, reason} -> {:error, reason}
    end
  end
end
