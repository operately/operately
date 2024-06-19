defmodule Operately.Operations.GoalDiscussionCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Comments.CommentThread

  @action :goal_discussion_creation

  def run(author, goal, title, message) do
    Multi.new()
    |> Multi.insert(:activity_without_thread, Activities.Activity.changeset(%{
      author_id: author.id,
      action: Atom.to_string(@action),
      content: Activities.build_content!(@action, %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
      })
    }))
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity_without_thread.id,
      parent_type: "activity",
      message: Jason.decode!(message),
      title: title,
      has_title: true,
    }) end)
    |> Multi.update(:activity, fn changes ->
      Activities.Activity.changeset(changes.activity_without_thread, %{
        comment_thread_id: changes.thread.id
      }) 
    end)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:activity)
  end
end
