defmodule Operately.Support.Features.ProjectContributorsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Access.Binding
      alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

      setup ctx do
        ctx
        |> Operately.Support.Features.ProjectContributorsSteps.create_project(name: "Test Project")
        |> Operately.Support.Features.ProjectContributorsSteps.setup_contributors()
        |> Operately.Support.Features.ProjectContributorsSteps.login()
      end
    end
  end
end
