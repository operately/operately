defmodule Operately.Operations.GoalClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Activities
  alias Operately.Comments.CommentThread

  def run(author, goal_id, success, retrospective) do
    goal = Goals.get_goal!(goal_id)

    changeset = Goals.Goal.changeset(goal, %{
      closed_at: DateTime.utc_now(),
      closed_by_id: author.id,
      success: success
    })

    Multi.new()
    |> Multi.update(:goal, changeset)
    |> Activities.insert_sync(author.id, :goal_closing, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: goal.group_id,
        goal_id: goal_id,
        success: success
      }
    end)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity.id,
      parent_type: "activity",
      message: Jason.decode!(retrospective)
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
