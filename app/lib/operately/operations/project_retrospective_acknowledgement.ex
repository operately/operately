defmodule Operately.Operations.ProjectRetrospectiveAcknowledgement do
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Operations.IdempotentAcknowledgement
  alias Operately.Projects.Retrospective

  def run(author, retrospective) do
    IdempotentAcknowledgement.run(retrospective, fn locked_retrospective ->
      changeset =
        Retrospective.changeset(locked_retrospective, %{
          acknowledged_at: DateTime.utc_now() |> DateTime.truncate(:second),
          acknowledged_by_id: author.id
        })

      Multi.new()
      |> Multi.update(:acknowledged_resource, changeset)
      |> Activities.insert_sync(author.id, :project_retrospective_acknowledged, fn _changes ->
        %{
          company_id: author.company_id,
          space_id: locked_retrospective.project.group_id,
          project_id: locked_retrospective.project_id,
          retrospective_id: locked_retrospective.id
        }
      end)
    end)
    |> case do
      {:ok, retrospective, :acknowledged} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
        {:ok, retrospective}

      {:ok, retrospective, :already_acknowledged} ->
        {:ok, retrospective}

      error ->
        error
    end
  end
end
