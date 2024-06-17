defmodule Operately.Projects.EditTimelineOperation do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Projects.{Project, Milestone}

  def run(author, project, attrs) do
    changeset = Project.changeset(project, %{
      started_at: attrs.project_start_date, 
      deadline: attrs.project_due_date
    })

    Multi.new()
    |> Multi.update(:project, changeset)
    |> update_milestones(attrs)
    |> insert_new_milestones(project, attrs)
    |> record_activity(author, project, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp update_milestones(multi, attrs) do
    Enum.reduce(attrs.milestone_updates, multi, fn milestone_update, multi ->
      milestone = Operately.Projects.get_milestone!(milestone_update.milestone_id)

      changeset = Operately.Projects.Milestone.changeset(milestone, %{
        title: milestone_update.title,
        description: milestone_update.description,
        deadline_at: milestone_update.due_time
      })

      multi |> Multi.update("updated_milestone_#{milestone.id}", changeset)
    end)
  end

  defp insert_new_milestones(multi, project, attrs) do
    attrs.new_milestones
    |> Enum.with_index()
    |> Enum.reduce(multi, fn {milestone, index}, multi ->
      changeset = Milestone.changeset(%{
        project_id: project.id,
        title: milestone.title,
        description: milestone.description,
        deadline_at: milestone.due_time,
        tasks_kanban_state: Operately.Tasks.KanbanState.initialize()
      })

      multi |> Multi.insert("new_milestone_#{index}", changeset)
    end)
  end

  defp record_activity(multi, author, project, attrs) do
    multi
    |> Activities.insert_sync(author.id, :project_timeline_edited, fn changes -> 
      %{
        company_id: project.company_id,
        project_id: project.id,
        old_start_date: project.started_at,
        new_start_date: changes.project.started_at,
        old_end_date: project.deadline,
        new_end_date: changes.project.deadline,
        milestone_updates: record_activity_updated_milestones(changes, attrs),
        new_milestones: record_activity_new_milestones(changes, attrs)
      }
    end)
  end

  defp record_activity_new_milestones(changes, attrs) do
    attrs.new_milestones
    |> Enum.with_index()
    |> Enum.map(fn {_, index} -> changes["new_milestone_#{index}"] end)
    |> Enum.map(fn milestone ->
      %{
        milestone_id: milestone.id,
        title: milestone.title,
        due_date: milestone.deadline_at
      }
    end)
  end

  defp record_activity_updated_milestones(changes, attrs) do
    Enum.map(attrs.milestone_updates, fn milestone_update ->
      milestone = changes["updated_milestone_#{milestone_update.milestone_id}"]

      %{
        milestone_id: milestone_update.milestone_id,
        old_title: milestone_update.title,
        new_title: milestone.title,
        old_due_date: milestone_update.due_time,
        new_due_date: milestone.deadline_at
      }
    end)
  end
end
