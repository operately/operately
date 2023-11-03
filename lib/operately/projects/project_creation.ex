defmodule Operately.Projects.ProjectCreation do
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Projects.Contributor
  alias Operately.Projects.Project
  alias Operately.Activities
  alias Ecto.Multi

  defstruct [:company_id, :name, :champion_id, :creator_id, :creator_role, :visibility]

  def run(%__MODULE__{} = params) do
    Multi.new()
    |> Multi.insert(:project, fn _changes ->
      Project.changeset(%{
        :company_id => params.company_id,
        :name => params.name,
        :private => is_private(params.visibility),
        :creator_id => params.creator_id,
        :started_at => DateTime.utc_now(),
        :next_update_scheduled_at => Operately.Time.first_friday_from_today(),
        :health => :on_track,
        :phase => :planning
      })
    end)
    |> Multi.insert(:champion, fn changes ->
      Contributor.changeset(%{
        project_id: changes.project.id,
        person_id: params.champion_id,
        responsibility: " ",
        role: :champion
      })
    end)
    |> Multi.run(:creator_role, fn _repo, changes -> assign_creator_role(changes.project, params) end)
    |> Multi.run(:phases, fn _repo, changes -> record_phase_histories(changes.project) end)
    |> Activities.insert(params.creator_id, :project_created, fn changes -> %{project_id: changes.project.id} end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp assign_creator_role(project, %__MODULE__{} = params) do
    cond do
      params.champion_id == params.creator_id ->
        {:ok, "Champion"}

      params.creator_role == "Reviewer" ->
        {:ok, _} = Projects.create_contributor(%{
          project_id: project.id,
          person_id: params.creator_id,
          responsibility: " ",
          role: :reviewer
        })

        {:ok, "Reviewer"}

      true ->
        {:ok, _} = Projects.create_contributor(%{
          project_id: project.id,
          person_id: params.creator_id,
          responsibility: params.creator_role,
          role: :contributor
        })

        {:ok, params.creator_role}
    end
  end

  defp record_phase_histories(project) do
    {:ok, _} = Operately.Projects.create_phase_history(%{
      project_id: project.id,
      phase: :planning,
      start_time: DateTime.utc_now()
    })

    {:ok, _} = Operately.Projects.create_phase_history(%{
      project_id: project.id,
      phase: :execution,
    })

    {:ok, _} = Operately.Projects.create_phase_history(%{
      project_id: project.id,
      phase: :control
    })
  end

  defp is_private(visibility) do
    visibility != "everyone"
  end
end
