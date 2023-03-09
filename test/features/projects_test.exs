defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase, file: "projects.feature"

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defand ~r/^I go to the projects page$/, _vars, state do
    state.session |> visit("/projects")
  end

  defthen ~r/^I should see the project "(?<name>[^"]+)" in the list of projects$/, %{name: name}, state do
    state.session
    |> visit("/projects")
    |> assert_has(Query.text(name))
  end

end
