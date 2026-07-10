defmodule Operately.Operations.ProjectRetrospectiveAcknowledgement do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.Retrospective

  def run(author, retrospective) do
    changeset = Retrospective.changeset(retrospective, %{
      acknowledged_at: DateTime.utc_now() |> DateTime.truncate(:second),
      acknowledged_by_id: author.id
    })

    Multi.new()
    |> Multi.update(:retrospective, changeset)
    |> Activities.insert_sync(author.id, :project_retrospective_acknowledged, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: retrospective.project.group_id,
        project_id: retrospective.project_id,
        retrospective_id: retrospective.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
    |> case do
      {:ok, retrospective} ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
        {:ok, retrospective}

      error -> error
    end
  end
end
