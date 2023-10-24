defmodule Operately.Projects.ProjectCreation do
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Projects.Project

  defstruct [:company_id, :name, :champion_id, :creator_id, :creator_role, :visibility]

  def run(%__MODULE__{} = params) do
    author = Operately.People.get_person!(params.creator_id)

    Operately.Activities.record(%{}, author, :project_created, fn _ ->
      {:ok, project} = create_project(params)
      {:ok, _champion} = assign_champion(project, params)
      {:ok, _creator_role} = assign_creator_role(project, params)
      {:ok, _} = record_phase_histories(project)

      {:ok, project}
    end)
  end

  defp create_project(%__MODULE__{} = params) do
    attrs = %{
      :company_id => params.company_id,
      :name => params.name,
      :private => is_private(params.visibility),
      :creator_id => params.creator_id,
      :started_at => DateTime.utc_now(),
      :next_update_scheduled_at => Operately.Time.first_friday_from_today(),
      :phase => :planning
    }

    %Project{} |> Project.changeset(attrs) |> Repo.insert()
  end

  defp is_private(visibility) do
    visibility != "everyone"
  end

  defp assign_champion(project, %__MODULE__{} = params) do
    {:ok, _} = Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: params.champion_id,
      responsibility: " ",
      role: :champion
    })
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
end
