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

  defand ~r/^I add a Key Result with the name "(?<kr_name>[^"]+)" as "(?<unit>[^"]+)" and the target value "(?<direction>[^"]+)" "(?<value>[^"]+)"$/, %{kr_name: name, direction: direction, unit: unit, value: value}, state do
    state.session
    |> click(Query.button("Add Key Result"))
    |> ts()
    |> scroll_into_view("#key-results-container")
    |> find(Query.css("#key-results-container [data-key-result]:last-child"), fn container ->
      container
      |> fill_in(Query.text_field("Name"), with: name)
      |> select(unit, from: "Unit")
      |> select(direction, from: "Direction")
      |> fill_in(Query.text_field("Target"), with: value)
    end)
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of Objectives$/, %{name: name}, state do
    state.session |> visit("/objectives") |> assert_text(name)
  end

  defwhen ~r/^I click on the "(?<name>[^"]+)" objective$/, %{name: name}, state do
    # Your implementation here
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the Objective title$/, %{name: name}, state do
    state.session |> assert_text(name)
  end

  defand ~r/^I should see "(?<description>[^"]+)" in the Objective description$/, %{description: description}, state do
    state.session |> assert_text(description)
  end

  defand ~r/^I should see "(?<name>[^"]+)" in the list of Key Results$/, %{timeframe: timeframe}, state do
    state.session |> assert_text(timeframe)
  end

  defand ~r/^I should see "(?<name>[^"]+)" in the list of Key Results$/, %{name: name}, state do
    state.session |> assert_text(name)
  end

end
