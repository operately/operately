defmodule OperatelyWeb.Api.Tasks.ArchiveBoard do
  @moduledoc "Archives a non-default task board without deleting its tasks. To archive the current default, first select another default with set_default_board."
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
         {:ok, _board} <- Operately.Operations.TaskBoardArchiving.run(me, space, board) do
      {:ok, %{success: true}}
    else
      {:error, :default_board} ->
        {:error, :bad_request, gettext("The default task board cannot be archived. Select another default board first."), %{code: "default_task_board_archive_forbidden"}}
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end
end
