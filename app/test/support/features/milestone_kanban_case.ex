defmodule Operately.Support.Features.MilestoneKanbanCase do
  defmacro __using__(_) do
    quote do
      @moduletag login_as: :champion

      alias Operately.Support.Factory
      alias Operately.Support.Features.MilestoneKanbanSteps, as: Steps
      alias Operately.Support.Features.ProjectSteps
      alias Operately.Support.Time

      setup ctx do
        ctx = ProjectSteps.create_project(ctx, name: "Kanban Project")

        ctx =
          ctx
          |> Map.put(:creator, ctx.champion)
          |> Factory.add_project_milestone(:milestone, :project, title: "Alpha Milestone")
          |> Factory.add_project_milestone(:another_milestone, :project, title: "Beta Milestone")
          |> Factory.add_project_task(:task, :milestone, name: "First Task")
          |> Factory.add_project_task(:second_task, :milestone, name: "Second Task")
          |> Factory.add_project_contributor(:teammate, :project, :as_person)
          |> ProjectSteps.login()

        status_values = Enum.map(ctx.project.task_statuses, & &1.value)

        {:ok, Map.put(ctx, :status_values, status_values)}
      end
    end
  end
end
