defmodule Operately.Features.KpisTest do
  use Operately.FeatureCase, file: "kpis.feature"

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defwhen ~r/^I go to the KPI page$/, _vars, state do
    state.session |> visit("/kpis")
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the KPI list$/, %{name: name}, state do
    state.session
    |> visit("/kpis")
    |> assert_has(Query.text(name))
  end
end
