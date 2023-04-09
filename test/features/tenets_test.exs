defmodule Operately.Features.TenetsTest do
  use Operately.FeatureCase, file: "tenets.feature"

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defand ~r/^I am on the Tenets page$/, _vars, state do
    state.session |> visit("/tenets")
  end

  defand ~r/^I click New Tenet$/, _vars, state do
    state.session |> click(Query.link("New Tenet"))
  end

  defthen ~r/^I should see "(?<tenet>[^"]+)" on the Tenets page$/, %{tenet: tenet}, state do
    state.session |> wait_for_page_to_load("/tenets")
    state.session |> assert_has(Query.text(tenet))
  end

end
