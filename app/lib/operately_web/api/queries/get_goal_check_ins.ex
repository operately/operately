defmodule OperatelyWeb.Api.Queries.GetGoalCheckIns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}

  inputs do
    field :goal_id, :id, required: true
  end

  outputs do
    field :check_ins, list_of(:goal_progress_update)
  end

  def call(conn, inputs) do
    with {:ok, _} <- get_goal(conn, inputs.goal_id) do
      check_ins = load(inputs.goal_id)
      {:ok, %{check_ins: Serializer.serialize(check_ins, level: :full)}}
    else
      {:error, :not_found} -> {:error, :not_found, "Goal not found"}
      {:error, :invalid_requester} -> {:error, :unauthorized}
    end
  end

  defp get_goal(conn, goal_id) do
    Goal.get(me(conn), id: goal_id)
  end

  defp load(goal_id) do
    from(u in Update, where: u.goal_id == ^goal_id, order_by: [desc: u.inserted_at], preload: [:author])
    |> Repo.all()
    |> Update.preload_comment_count()
  end
end
