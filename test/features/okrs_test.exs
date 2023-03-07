defmodule MyApp.Features.OkrsTest do
  use Operately.FeatureCase, file: "okrs.feature"

  defgiven ~r/^I am logged in as a user$/, _vars, state do
  end

  defand ~r/^I am on the Objectives page$/, _vars, state do
    state.session |> visit("/objectives")
  end

  defwhen ~r/^I click on the Create Objective button$/, _vars, state do
    state.session |> click(Query.button("New Objective"))
  end

  defand ~r/^I fill in the Objective Name field with "(?<name>[^"]+)"$/, %{name: name}, state do
    state.session |> fill_in(Query.text_field("Name"), with: name)
  end

  defand ~r/^I fill in the Objective Description field with "(?<description>[^"]+)"$/, %{description: description}, state do
    state.session |> fill_in(Query.text_field("Description"), with: description)
  end

  defand ~r/^I choose "(?<timeframe>[^"]+)" from the Timeframe dropdown$/, %{timeframe: timeframe}, state do
    state.session |> select(timeframe, from: "Timeframe")
  end

  defand ~r/^I click on the Create Objective and results button$/, _vars, state do
    state.session |> click(Query.button("Save Objective"))
  end

  defand ~r/^I add a Key Result with the name "(?<kr_name>[^"]+)" and the target value "(?<direction>[^"]+)" "(?<value>[^"]+)"$/, %{kr_name: name, direction: direction, value: value}, state do
    state.session |> click("Add Key Result")
    state.session |> fill_in("Name", with: name)
    state.session |> select(direction, from: "Direction")
    state.session |> fill_in("Target value", with: value)
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of Objectives$/, %{name: name}, state do
    state.session |> visit("/objectives") |> assert_text(name)
  end
end
