defmodule OperatelyWeb.Api.Tasks.ListBoards do
  @moduledoc "Lists accessible task boards for exactly one project or space in saved order without loading their tasks."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :archive_status, :task_board_archive_status, null: false
  end

  outputs do
    field :boards, list_of(:task_board_summary), null: false
  end

  def call(conn, inputs) do
    with {:ok, %{owner: owner}} <- OperatelyWeb.Api.Tasks.BoardScope.select(me(conn), inputs) do
      {:ok, %{boards: Serializer.serialize(OperatelyWeb.Api.Tasks.BoardScope.list(me(conn), owner, inputs[:archive_status] || :active))}}
    end
  end
end
