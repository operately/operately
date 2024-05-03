defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo

  alias Operately.Activities
  alias Operately.Goals
  alias Operately.Goals.Goal
  alias Operately.Comments.CommentThread

  def run(author, attrs) do
    goal = Goals.get_goal!(attrs.id)

    Multi.new()
    |> Multi.update(:goal, Goal.changeset(goal, %{timeframe: attrs.timeframe}))
    |> Multi.insert(:activity_without_thread, fn changes ->
      Activities.Activity.changeset(%{
        author_id: author.id,
        action: Atom.to_string(:goal_timeframe_editing),
        content: Activities.build_content!(:goal_timeframe_editing, %{
          company_id: goal.company_id,
          space_id: goal.group_id,
          goal_id: goal.id,
          old_timeframe: Map.from_struct(goal.timeframe),
          new_timeframe: Map.from_struct(changes.goal.timeframe)
        })
      })
    end)
    |> Multi.insert(:thread, fn changes -> CommentThread.changeset(%{
      parent_id: changes.activity_without_thread.id,
      parent_type: "activity",
      message: Jason.decode!(attrs.comment)
    }) end)
    |> Multi.update(:activity, fn changes ->
      Activities.Activity.changeset(changes.activity_without_thread, %{comment_thread_id: changes.thread.id}) 
    end)
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
