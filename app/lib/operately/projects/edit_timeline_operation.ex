defmodule Operately.Projects.EditTimelineOperation do
  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Projects.{Project, Milestone}
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  def run(author, project, attrs) do
    changeset = Project.changeset(project, %{
      timeframe: %{
        contextual_start_date: attrs.project_start_date,
        contextual_end_date: attrs.project_due_date,
      }
    })

    Multi.new()
    |> Multi.update(:project, changeset)
    |> update_milestones(attrs)
    |> insert_new_milestones(author, project, attrs)
    |> record_activity(author, project, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  defp update_milestones(multi, attrs) do
    Enum.reduce(attrs.milestone_updates, multi, fn milestone_update, multi ->
      milestone = Operately.Projects.get_milestone!(milestone_update.milestone_id)
      started_date = Timeframe.start_date(milestone.timeframe) || milestone.inserted_at

      changeset = Operately.Projects.Milestone.changeset(milestone, %{
        title: milestone_update.title,
        description: milestone_update.description,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(started_date),
          contextual_end_date: milestone_update.due_date,
        }
      })

      multi |> Multi.update("updated_milestone_#{milestone.id}", changeset)
    end)
  end

  defp insert_new_milestones(multi, author, project, attrs) do
    starting_position = Operately.Projects.next_milestone_position(project.id)

    attrs.new_milestones
    |> Enum.with_index()
    |> Enum.reduce(multi, fn {milestone, index}, multi ->
      changeset = Milestone.changeset(%{
        project_id: project.id,
        creator_id: author.id,
        title: milestone.title,
        description: milestone.description,
        tasks_kanban_state: Operately.Tasks.KanbanState.initialize(),
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: milestone.due_date,
        },
        position: starting_position + index
      })

      multi |> Multi.insert("new_milestone_#{index}", changeset)
    end)
  end

  defp record_activity(multi, author, project, attrs) do
    multi
    |> Activities.insert_sync(author.id, :project_timeline_edited, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        old_start_date: Timeframe.start_date(project.timeframe),
        new_start_date: Timeframe.start_date(changes.project.timeframe),
        old_end_date: Timeframe.end_date(project.timeframe),
        new_end_date: Timeframe.end_date(changes.project.timeframe),
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
        due_date: Timeframe.end_date(milestone.timeframe),
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
        old_due_date: milestone_update.due_date.date,
        new_due_date: Timeframe.end_date(milestone.timeframe)
      }
    end)
  end
end
