defmodule Operately.Operations.ProjectCheckInAcknowledgement do
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Operations.IdempotentAcknowledgement
  alias Operately.Projects.CheckIn

  def run(author, check_in) do
    IdempotentAcknowledgement.run(check_in, fn locked_check_in ->
      changeset =
        CheckIn.changeset(locked_check_in, %{
          acknowledged_at: NaiveDateTime.utc_now(),
          acknowledged_by_id: author.id
        })

      Multi.new()
      |> Multi.update(:acknowledged_resource, changeset)
      |> Activities.insert_sync(author.id, :project_check_in_acknowledged, fn _changes ->
        %{
          company_id: author.company_id,
          space_id: locked_check_in.project.group_id,
          project_id: locked_check_in.project_id,
          check_in_id: locked_check_in.id
        }
      end)
    end)
    |> case do
      {:ok, check_in, :acknowledged} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
        {:ok, check_in}

      {:ok, check_in, :already_acknowledged} ->
        {:ok, check_in}

      error ->
        error
    end
  end
end
