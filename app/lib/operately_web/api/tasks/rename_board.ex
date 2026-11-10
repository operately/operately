defmodule OperatelyWeb.Api.Tasks.RenameBoard do
  @moduledoc "Renames a task board. Requires space edit access."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.Permissions
  alias Operately.Tasks.TaskBoard

  inputs do
    field :board_id, :id, null: false
    field :new_name, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, board} <- TaskBoard.get(me, id: inputs.board_id),
         {:ok, :allowed} <- Permissions.check(board.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, _board} <- Operately.Operations.TaskBoardRenaming.run(me, board, inputs.new_name) do
      {:ok, %{success: true}}
    else
      {:error, %Ecto.Changeset{errors: [name: {"can't be blank", _}]}} -> {:error, :bad_request, gettext("Name is required"), %{field: "new_name"}}
      {:error, %Ecto.Changeset{errors: [name: error]}} -> {:error, :bad_request, Operately.I18n.ValidationErrors.translate(error), %{field: "new_name"}}
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end
end
