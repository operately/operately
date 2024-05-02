defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, attrs) do
    goal = Operately.Goals.get_goal!(attrs.id)

    Multi.new()
    |> Multi.update(:goal, Operately.Goals.Goal.changeset(goal, %{timeframe: attrs.timeframe}))
    |> Multi.insert(:comment_thread, Operately.Comments.CommentThread.changeset(%{message: Jason.decode!(attrs.comment)}))
    |> Multi.insert(:activity, fn changes ->
      Activities.Activity.changeset(%{
        author_id: author.id,
        comment_thread_id: changes.comment_thread.id,
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
    |> Activities.dispatch_notification()
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end
