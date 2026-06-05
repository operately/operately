defmodule Operately.Support.Features.ProjectTasksCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.ProjectSteps
      alias Operately.Support.Features.ProjectTasksSteps, as: Steps

      setup ctx do
        ctx
        |> Operately.Support.Features.ProjectSteps.create_project(name: "Test Project")
        |> Operately.Support.Factory.add_project_milestone(:milestone, :project)
        |> Operately.Support.Features.ProjectTasksSteps.setup_contributor()
        |> Operately.Support.Features.ProjectSteps.login()
      end
    end
  end
end
