defmodule Operately.Projects.EditTimelineOperation do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Projects.{Project, PhaseHistory, Milestone}

  def run(author, project, attrs) do
    phases = Operately.Projects.list_project_phase_history(project)

    planning = Enum.find(phases, fn phase -> phase.phase == :planning end)
    execution = Enum.find(phases, fn phase -> phase.phase == :execution end)
    control = Enum.find(phases, fn phase -> phase.phase == :control end)

    start_date = attrs.project_start_time
    due_date = attrs.control_due_time

    Multi.new()
    |> Multi.update(:project, Project.changeset(project, %{started_at: start_date, deadline: due_date}))
    |> Multi.update(:planning_phase, PhaseHistory.changeset(planning, %{start_time: start_date, due_time: attrs.planning_due_time}))
    |> Multi.update(:execution_phase, PhaseHistory.changeset(execution, %{start_time: attrs.planning_due_time, due_time: attrs.execution_due_time}))
    |> Multi.update(:control_phase, PhaseHistory.changeset(control, %{start_time: attrs.execution_due_time, due_time: due_date}))
    |> update_milestones(attrs)
    |> insert_new_milestones(project, attrs)
    |> record_activity(author, project, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp update_milestones(multi, attrs) do
    multi |> Enum.reduce(attrs.milestone_updates, fn milestone_update, multi ->
      milestone = Operately.Projects.get_milestone!(milestone_update.milestone_id)

      changeset = Operately.Projects.Milestone.changeset(milestone, %{
        title: milestone_update.title,
        deadline_at: milestone_update.due_time
      })

      multi |> Multi.update("milestone_#{milestone.id}", changeset)
    end)
  end

  defp insert_new_milestones(multi, project, attrs) do
    multi
    |> Enum.reduce(attrs.input.new_milestones, fn milestone, multi ->
      changeset = Milestone.changeset(%{
        project_id: project.id,
        title: milestone.title,
        deadline_at: milestone.due_time
      })

      multi |> Multi.insert("new_milestone_#{milestone.id}", changeset)
    end)
  end

  defp record_activity(multi, author, project, attrs) do
    multi
    |> Activities.insert(author.id, :project_timeline_edited, fn changes -> 
      params = %{
        project_id: project.id,
        old_start_date: project.started_at,
        new_start_date: changes.project.started_at,
        old_end_date: project.deadline,
        new_end_date: changes.project.deadline,
        milestone_edits: attrs.milestone_updates,
        new_milestones: attrs.input.new_milestones
      }

      Operately.Activities.Content.ProjectTimelineEdited.build(params)
    end)
  end
end
