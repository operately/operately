defmodule Operately.Features.TenetsTest do
  use Operately.FeatureCase, file: "tenets.feature"

  defgiven ~r/^I am logged in as a user$/, _vars, state do
  end

  defand ~r/^I am on the Tenets page$/, _vars, state do
    state.session |> visit("/tenets")
  end

  defwhen ~r/^I click the "(?<button_name>[^"]+)" button$/, %{button_name: button_name}, state do
    state.session |> click(Query.button(button_name))
  end

  defand ~r/^I fill in "(?<field>[^"]+)" with "(?<value>[^"]+)"$/, %{field: field, value: value}, state do
    state.session |> fill_in(Query.text_field(field), with: value)
  end

  defthen ~r/^I should see "(?<tenet>[^"]+)" on the Tenets page$/, %{tenet: tenet}, state do
    state.session |> assert_has(Query.text(tenet))
  end

end
