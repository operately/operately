defmodule Operately.Operations.GoalDeleting do
  alias Ecto.Multi
  alias Operately.{Repo, Goals, Updates}

  def run(goal) do
    Multi.new()
    |> Multi.run(:discussions, fn _, _ ->
      {_count, discussions} = Goals.delete_goal_discussion(goal.id)
      {:ok, discussions}
    end)
    |> Multi.run(:updates, fn _, _ ->
      updates = Goals.list_updates(goal)
      {:ok, updates}
    end)
    |> Multi.run(:comments, fn _, changes ->
      discussion_ids = Enum.map(changes.discussions, fn discussion -> discussion.id end)
      update_ids = Enum.map(changes.updates, fn update -> update.id end)

      {_count, comments} = Updates.delete_comments(discussion_ids ++ update_ids)
      {:ok, comments}
    end)
    |> Multi.delete(:goal, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
