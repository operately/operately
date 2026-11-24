defmodule OperatelyWeb.Api.WorkMaps.ParentChanges do
  import Ecto.Query
  alias Operately.{Access.Filters, Goals.Goal, Projects.Project, Repo}
  alias OperatelyWeb.Api.{Goals, Projects}

  def apply_parent_changes(_, _, []), do: :ok

  def apply_parent_changes(conn, scope, moves) do
    # Company and space maps can edit the same hierarchy.
    Operately.Goals.lock_hierarchy(scope.person.company_id)

    Enum.reduce_while(moves, :ok, fn move, :ok ->
      case move(conn, scope, move) do
        {:ok, _} -> {:cont, :ok}
        {:error, kind, _message} -> {:halt, {:error, kind}}
        {:error, _} = error -> {:halt, error}
      end
    end)
  end

  defp move(conn, scope, %{item_id: id, type: type, parent_id: parent})
       when not is_nil(id) and type in [:goal, :project] do
    schema = if type == :goal, do: Goal, else: Project

    with :ok <- verify_resource(schema, scope, id),
         :ok <- verify_destination(scope, parent) do
      case type do
        :goal -> Goals.UpdateParentGoal.call(conn, %{goal_id: id, parent_goal_id: parent})
        :project -> Projects.UpdateParentGoal.call(conn, %{project_id: id, goal_id: parent})
      end
    end
  end

  defp move(_, _, _), do: {:error, :bad_request}

  defp verify_destination(_, nil), do: :ok

  defp verify_destination(scope, id), do: verify_resource(Goal, scope, id)

  defp verify_resource(schema, scope, id) do
    query = from r in schema, where: r.id == ^id and r.company_id == ^scope.person.company_id, select: r.id
    query = if scope.space_id, do: where(query, [r], r.group_id == ^scope.space_id), else: query

    # Keep the item in this scope until the parent change commits, even during a space transfer.
    query = query |> Filters.filter_by_view_access(scope.person.id) |> lock([r], fragment("FOR NO KEY UPDATE OF ?", r))
    if Repo.one(query), do: :ok, else: {:error, :not_found}
  end
end
