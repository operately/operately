defmodule Operately.Operations.GoalDeleting do
  @moduledoc """
  Handles the deletion of a goal and its related entities.

  ## Deletion Process

  Direct associations to the goal (i.e. check-ins, access context, and access bindings)
  are automatically cascade deleted at the database level.

  Polymorphic associations (i.e. discussions, comments, and reactions)
  need to be deleted manually as part of the transaction since they don't have
  direct foreign key constraints to the goal table.
  """

  alias Ecto.Multi
  alias Operately.{Repo, Goals, Updates}

  def run(goal) do
    Multi.new()
    |> delete_discussions(goal)
    |> collect_check_ins(goal)
    |> delete_comments()
    |> delete_reactions()
    |> Multi.delete(:goal, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end

  defp delete_discussions(multi, goal) do
    Multi.run(multi, :discussions, fn _, _ ->
      {_count, discussions} = Goals.delete_goal_discussion(goal.id)
      {:ok, discussions}
    end)
  end

  defp collect_check_ins(multi, goal) do
    Multi.run(multi, :check_ins, fn _, _ ->
      check_ins = Goals.list_updates(goal) |> Enum.map(& &1.id)
      {:ok, check_ins}
    end)
  end

  defp delete_comments(multi) do
    Multi.run(multi, :comments, fn _, changes ->
      %{discussions: discussion_ids, check_ins: check_in_ids} = changes

      {_count, comments} = Updates.delete_comments(discussion_ids ++ check_in_ids)
      {:ok, comments}
    end)
  end

  defp delete_reactions(multi) do
    Multi.run(multi, :reactions, fn _, changes ->
      %{discussions: discussion_ids, check_ins: check_in_ids, comments: comment_ids} = changes

      {_count, reactions} = Updates.delete_reactions(discussion_ids ++ check_in_ids ++ comment_ids)
      {:ok, reactions}
    end)
  end
end
