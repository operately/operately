defmodule Operately.Operations.GoalUpdateAcknowledging do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Goals.Update
  alias Operately.Operations.IdempotentAcknowledgement

  def run(person, update) do
    IdempotentAcknowledgement.run(update, fn locked_update ->
      changeset =
        Update.changeset(locked_update, %{
          acknowledged_at: DateTime.utc_now(),
          acknowledged_by_id: person.id
        })

      Multi.new()
      |> Multi.update(:acknowledged_resource, changeset)
      |> Activities.insert_sync(person.id, :goal_check_in_acknowledgement, fn _changes ->
        %{
          company_id: person.company_id,
          space_id: locked_update.goal.group_id,
          goal_id: locked_update.goal_id,
          update_id: locked_update.id
        }
      end)
    end)
    |> case do
      {:ok, update, :acknowledged} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
        {:ok, update}

      {:ok, update, :already_acknowledged} ->
        {:ok, update}

      error ->
        error
    end
  end
end
