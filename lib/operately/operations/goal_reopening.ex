defmodule Operately.Operations.GoalReopening do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Goals
  alias Operately.Comments.CommentThread

  @action :goal_reopening

  def run(author, goal_id, message) do
    goal = Goals.get_goal!(goal_id)
    changeset = Goals.Goal.changeset(goal, %{closed_at: nil, closed_by_id: nil})

    Multi.new()
    |> Multi.update(:goal, changeset)
    |> Activities.insert_sync(author.id, @action, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: goal.group_id,
        goal_id: goal_id,
      }
    end)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity.id,
      parent_type: "activity",
      message: Jason.decode!(message)
    }) end)
    |> Multi.update(:activity_with_thread, fn changes ->
      Activities.Activity.changeset(changes.activity, %{
        comment_thread_id: changes.thread.id
      })
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
