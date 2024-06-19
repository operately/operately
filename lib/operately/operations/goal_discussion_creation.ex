defmodule Operately.Operations.GoalDiscussionCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Comments.CommentThread

  @action :goal_discussion_creation

  def run(author, goal_id, title, message) do
    goal = Operately.Goals.get_goal!(goal_id)

    Multi.new()
    |> Activities.insert_sync(author.id, @action, fn _changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
      }
    end)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity.id,
      parent_type: "activity",
      message: Jason.decode!(message),
      title: title,
      has_title: true,
    }) end)
    |> Multi.update(:activity_with_thread, fn changes ->
      Activities.Activity.changeset(changes.activity, %{
        comment_thread_id: changes.thread.id
      })
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:activity_with_thread)
  end
end
