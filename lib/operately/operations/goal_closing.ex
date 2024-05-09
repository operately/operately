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
    |> Multi.insert(:activity_without_thread, fn _changes ->
      Activities.Activity.changeset(%{
        author_id: author.id,
        action: Atom.to_string(:goal_closing),
        content: Activities.build_content!(:goal_closing, %{
          company_id: author.company_id,
          space_id: goal.group_id,
          goal_id: goal_id,
          success: success
        })
      })
    end)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity_without_thread.id,
      parent_type: "activity",
      message: Jason.decode!(retrospective)
    }) end)
    |> Multi.update(:activity, fn changes ->
      Activities.Activity.changeset(changes.activity_without_thread, %{
        comment_thread_id: changes.thread.id
      }) 
    end)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
