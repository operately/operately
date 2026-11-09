defmodule OperatelyWeb.Api.Tasks.ListBoards do
  @moduledoc "Lists accessible task boards in saved order without loading their tasks."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :id, null: false
    field? :archive_status, :task_board_archive_status, null: false
  end

  outputs do
    field :boards, list_of(:task_board_summary), null: false
  end

  def call(conn, inputs) do
    with {:ok, space} <- Operately.Groups.Group.get(me(conn), id: inputs.space_id) do
      {:ok, %{boards: Serializer.serialize(OperatelyWeb.Api.Tasks.BoardScope.list(me(conn), space, inputs[:archive_status] || :active))}}
    end
  end
end
