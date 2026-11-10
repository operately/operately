defmodule OperatelyWeb.Api.Tasks.SetDefaultBoard do
  @moduledoc "Selects the active task board used by space requests without a board selector."

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.{Group, Permissions}
  alias OperatelyWeb.Api.Tasks.BoardScope

  inputs do
    field :space_id, :id, null: false
    field :board_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, space} <- Group.get(me, id: inputs.space_id),
         {:ok, :allowed} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, board} <- BoardScope.resolve(me, space, inputs.board_id),
         {:ok, _space} <- Operately.Operations.TaskBoardDefaultChanging.run(me, space, board) do
      {:ok, %{success: true}}
    else
      {:error, :board_archived} -> {:error, :bad_request, gettext("This task board is archived. Restore it before making changes."), %{code: "task_board_archived"}}
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end
end
