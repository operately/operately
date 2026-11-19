defmodule OperatelyWeb.Api.Tasks.List do
  @moduledoc "Lists tasks for a project, a space, or a board. Space-only requests include direct tasks across all space boards. Optional owner and board selectors must match."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Tasks.BoardScope

  inputs do
    field? :project_id, :id, null: true
    field? :space_id, :id, null: true
    field? :board_id, :id, null: true
  end

  outputs do
    field :tasks, list_of(:task), null: false
  end

  def call(conn, inputs) do
    with {:ok, %{owner: owner, board: board}} <- BoardScope.select(me(conn), inputs) do
      filters =
        case owner do
          %Operately.Projects.Project{} -> [project_id: owner.id]
          %Operately.Groups.Group{} -> [space_id: owner.id]
        end

      filters = if board, do: Keyword.put(filters, :board_id, board.id), else: filters
      preloads = [:assigned_people, subscription_list: [subscriptions: :person]]
      preloads = if match?(%Operately.Projects.Project{}, owner), do: [:milestone | preloads], else: preloads

      tasks = Task.list(me(conn), filters ++ [opts: [preload: preloads]]) |> Task.load_comments_count()
      {:ok, %{tasks: Serializer.serialize(tasks, level: :full)}}
    end
  end
end
