defmodule OperatelyWeb.Api.Queries.ListGoalCheckIns do
  @moduledoc """
  Lists check-ins for a goal.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Drafts

  inputs do
    field :goal_id, :id, null: false
  end

  outputs do
    field :check_ins, list_of(:goal_progress_update), null: false
  end

  def call(conn, inputs) do
    with {:ok, _} <- get_goal(conn, inputs.goal_id) do
      check_ins = load(inputs.goal_id, me(conn))
      {:ok, %{check_ins: Serializer.serialize(check_ins, level: :full)}}
    else
      {:error, :not_found} -> {:error, :not_found, "Goal not found"}
      {:error, :invalid_requester} -> {:error, :unauthorized}
    end
  end

  defp get_goal(conn, goal_id) do
    Goal.get(me(conn), id: goal_id)
  end

  defp load(goal_id, person) do
    from(u in Update,
      where: u.goal_id == ^goal_id,
      where: u.state == :published or (u.state in [:draft, :scheduled] and u.author_id == ^person.id),
      preload: [:author]
    )
    |> Repo.all()
    |> Drafts.sort_by_display_date_desc()
    |> Update.preload_comment_count()
  end
end
