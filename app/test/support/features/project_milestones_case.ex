defmodule Operately.Support.Features.ProjectMilestonesCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps
      alias Operately.Support.Features.ProjectSteps

      setup ctx do
        ctx
        |> Operately.Support.Features.ProjectSteps.create_project(name: "Live support")
        |> Operately.Support.Factory.add_company_owner(:creator)
        |> Operately.Support.Factory.add_project_contributor(:contributor, :project, permissions: :edit_access)
        |> Operately.Support.Factory.preload(:contributor, :person)
        |> Operately.Support.Factory.add_project_contributor(:commenter, :project, permissions: :comment_access)
        |> Operately.Support.Factory.preload(:commenter, :person)
        |> Operately.Support.Factory.add_project_contributor(:viewer, :project, permissions: :view_access)
        |> Operately.Support.Factory.preload(:viewer, :person)
      end
    end
  end
end
