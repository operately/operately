defmodule Operately.Operations.GoalRetrospectiveAcknowledgement do
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Comments.CommentThread
  alias Operately.Operations.IdempotentAcknowledgement

  def run(person, activity, comment_thread, goal) do
    IdempotentAcknowledgement.run(comment_thread, fn locked_comment_thread ->
      changeset =
        CommentThread.changeset(locked_comment_thread, %{
          acknowledged_at: DateTime.utc_now() |> DateTime.truncate(:second),
          acknowledged_by_id: person.id
        })

      Multi.new()
      |> Multi.update(:acknowledged_resource, changeset)
      |> Activities.insert_sync(person.id, :goal_retrospective_acknowledged, fn _changes ->
        %{
          company_id: person.company_id,
          space_id: goal.group_id,
          goal_id: goal.id,
          retrospective_id: activity.id
        }
      end)
    end)
    |> case do
      {:ok, comment_thread, :acknowledged} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
        {:ok, comment_thread}

      {:ok, comment_thread, :already_acknowledged} ->
        {:ok, comment_thread}

      error ->
        error
    end
  end
end
