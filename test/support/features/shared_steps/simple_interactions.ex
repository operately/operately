defmodule Operately.Features.SharedSteps.SimpleInteractions do
  use Cabbage.Feature

  defand ~r/^I click on the "(?<button_title>[^"]+)" button$/, %{button_title: button_title}, state do
    state.session |> click(Query.button(button_title))
  end

  defand ~r/^I fill in the "(?<field_name>[^"]+)" field with "(?<value>[^"]+)"$/, %{field_name: field_name, value: value}, state do
    state.session |> fill_in(Query.text_field(field_name), with: value)
  end

  defand ~r/^I select the "(?<select_name>[^"]+)" option with "(?<option>[^"]+)"$/, %{select_name: select_name, option: option}, state do
    state.session
    |> find(Query.select(select_name), fn select ->
      click(select, Query.option(option))
    end)
  end

  defand ~r/^I take a screenshot$/, _vars, state do
    state.session |> take_screenshot()
  end
end
