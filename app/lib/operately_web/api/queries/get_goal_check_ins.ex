defmodule OperatelyWeb.Api.Queries.GetGoalCheckIns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}

  inputs do
    field :goal_id, :id, required: true
    field :include_comment_count, :boolean
  end

  outputs do
    field :check_ins, :goal_progress_update
  end

  def call(conn, inputs) do
    with {:ok, _} <- get_goal(conn, inputs.goal_id) do
      check_ins = load(inputs.goal_id, inputs.include_comment_count)
      {:ok, %{check_ins: Serializer.serialize(check_ins, level: :full)}}
    else
      {:error, :not_found} -> {:error, :not_found, "Goal not found"}
      {:error, :unauthorized} -> {:error, :unauthorized}
    end
  end

  defp get_goal(conn, goal_id) do
    Goal.get(me(conn), id: goal_id)
  end

  defp load(goal_id, include_comment_count) do
    from(u in Update, where: u.goal_id == ^goal_id, order_by: [desc: u.inserted_at])
    |> Repo.all()
    |> then(fn check_ins ->
      if include_comment_count do
        Update.preload_comment_count(check_ins)
      else
        check_ins
      end
    end)
  end
end
