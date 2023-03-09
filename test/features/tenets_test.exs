defmodule Operately.Features.TenetsTest do
  use Operately.FeatureCase, file: "tenets.feature"

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defand ~r/^I am on the Tenets page$/, _vars, state do
    state.session |> visit("/tenets")
  end

  defthen ~r/^I should see "(?<tenet>[^"]+)" on the Tenets page$/, %{tenet: tenet}, state do
    state.session |> assert_has(Query.text(tenet))
  end

end
