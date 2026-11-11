defmodule OperatelyWeb.Api.Tasks.RestoreBoard do
  @moduledoc "Restores an archived task board at the end of the active list without changing the default."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

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
         {:ok, _board} <- Operately.Operations.TaskBoardRestoring.run(me, space, board) do
      {:ok, %{success: true}}
    else
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end
end
