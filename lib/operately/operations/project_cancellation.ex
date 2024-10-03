defmodule Operately.Operations.ProjectCancellation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Access
  alias Operately.Projects.{Project, Contributor}

  defstruct [
    :project_id,
    :canceller_id,
    :reason
  ]

  def run(%__MODULE__{} = params) do
    project = Repo.get!(Project, params.project_id)

    Multi.new()
    |> update_project(project, params.reason)
    |> remove_contributors(project)
    |> remove_access_bindings(project)
    |> insert_activity(params.canceller_id, project, params.reason)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp update_project(multi, project, reason) do
    Multi.update(multi, :project, Project.cancellation_changeset(project, %{
      cancelled_at: DateTime.utc_now(),
      cancellation_reason: reason,
      status: :cancelled
    }))
  end

  defp remove_contributors(multi, project) do
    Multi.delete_all(multi, :remove_contributors, fn _ ->
      from(c in Contributor, where: c.project_id == ^project.id)
    end)
  end

  defp remove_access_bindings(multi, project) do
    Multi.run(multi, :remove_bindings, fn _repo, _changes ->
      {count, nil} = Access.delete_all_bindings(project)
      {:ok, count}
    end)
  end

  defp insert_activity(multi, canceller_id, project, reason) do
    Activities.insert_sync(multi, canceller_id, :project_cancelled, fn _ ->
      %{
        company_id: project.company_id,
        project_id: project.id,
        canceller_id: canceller_id,
        cancellation_reason: reason
      }
    end)
  end
end
