defmodule Operately.Operations.GoalUpdateAcknowledging do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Goals.Update

  def run(person, update) do
    Multi.new()
    |> Multi.update(:update, Update.changeset(update, %{
      acknowledged_at: DateTime.utc_now,
      acknowledged_by_id: person.id,
    }))
    |> Activities.insert_sync(person.id, :goal_check_in_acknowledgement, fn _changes ->
      %{
        company_id: person.company_id,
        goal_id: update.goal_id,
        update_id: update.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
    |> case do
      {:ok, update} ->
        OperatelyWeb.ApiSocket.broadcast!("api:assignments_count:#{person.id}")
        {:ok, update}

      error -> error
    end
  end
end
