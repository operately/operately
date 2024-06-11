defmodule Operately.Operations.ProjectCreation do
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Projects.Contributor
  alias Operately.Projects.Project
  alias Operately.Activities
  alias Operately.Access.Context
  alias Ecto.Multi

  defstruct [
    :company_id,
    :name,
    :champion_id,
    :reviewer_id,
    :creator_id,
    :creator_role,
    :creator_is_contributor,
    :visibility,
    :group_id,
    :goal_id
  ]

  def run(%__MODULE__{} = params) do
    Multi.new()
    |> Multi.insert(:project, fn _changes ->
      Project.changeset(%{
        :company_id => params.company_id,
        :group_id => params.group_id,
        :goal_id => params.goal_id,
        :name => params.name,
        :private => is_private(params.visibility),
        :creator_id => params.creator_id,
        :started_at => DateTime.utc_now(),
        :next_check_in_scheduled_at => Operately.Time.first_friday_from_today(),
        :health => :on_track,
      })
    end)
    |> Multi.insert(:context, fn changes ->
      Context.changeset(%{
        project_id: changes.project.id,
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
    |> Multi.insert(:reviewer, fn changes ->
      Contributor.changeset(%{
        project_id: changes.project.id,
        person_id: params.reviewer_id,
        responsibility: " ",
        role: :reviewer
      })
    end)
    |> Multi.run(:creator_role, fn _repo, changes -> assign_creator_role(changes.project, params) end)
    |> Multi.run(:phases, fn _repo, changes -> record_phase_histories(changes.project) end)
    |> Activities.insert_sync(params.creator_id, :project_created, fn changes -> %{
      company_id: changes.project.company_id,
      project_id: changes.project.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp assign_creator_role(project, %__MODULE__{} = params) do
    cond do
      params.champion_id == params.creator_id ->
        {:ok, "Champion"}

      params.reviewer_id == params.creator_id ->
        {:ok, "Reviewer"}

      params.creator_is_contributor == "no" ->
        {:ok, "not contributing"}

      params.creator_is_contributor == "yes" ->
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
