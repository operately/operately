defmodule Operately.Operations.GoalRetrospectiveAcknowledgement do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Comments.CommentThread

  def run(person, activity, comment_thread, goal) do
    changeset = CommentThread.changeset(comment_thread, %{
      acknowledged_at: DateTime.utc_now() |> DateTime.truncate(:second),
      acknowledged_by_id: person.id
    })

    Multi.new()
    |> Multi.update(:comment_thread, changeset)
    |> Activities.insert_sync(person.id, :goal_retrospective_acknowledged, fn _changes ->
      %{
        company_id: person.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        retrospective_id: activity.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:comment_thread)
    |> case do
      {:ok, comment_thread} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
        {:ok, comment_thread}

      error -> error
    end
  end
end
