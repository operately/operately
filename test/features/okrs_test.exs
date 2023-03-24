defmodule MyApp.Features.OkrsTest do
  use Operately.FeatureCase, file: "okrs.feature"

  alias Operately.OkrsFixtures
  alias Operately.PeopleFixtures
  alias Operately.OwnershipsFixtures

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defand ~r/^I am on the Objectives page$/, _vars, state do
    state.session |> visit("/objectives")
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

  defand ~r/^I choose "(?<person>[^"]+)" from the Owner dropdown$/, %{person: person}, state do
    state.session |> select(person, from: "Owner")
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of Objectives$/, %{name: name}, state do
    state.session |> visit("/objectives") |> assert_text(name)
  end

  defwhen ~r/^I click on the "(?<name>[^"]+)" objective$/, %{name: name}, state do
    state.session |> click(Query.link(name))
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the Objective title$/, %{name: name}, state do
    state.session |> ts()
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

  defand ~r/^I have an objective called "(?<name>[^"]+)" owned by "(?<person_name>[^"]+)"$/, %{name: name, person_name: person_name}, state do
    person = Operately.People.get_person_by_name!(person_name)
    objective = OkrsFixtures.objective_fixture(%{name: name})

    OwnershipsFixtures.ownership_fixture(%{
      person_id: person.id,
      target: objective.id,
      target_id: :objective
    })
  end

  defand ~r/^I have "(?<person_name>[^"]+)" in my organization as the "(?<title>[^"]+)"$/, %{person_name: name, title: title}, state do
    PeopleFixtures.person_fixture(%{
      full_name: name,
      handle: name |> String.downcase |> String.replace(" ", "_"),
      title: title
    })
  end

  defwhen ~r/^I click on the "(?<name>[^"]+)" Objective$/, %{name: name}, state do
    state.session |> click(Query.link(name))
  end

  defand ~r/^I set the target to "(?<target>[^"]+)"$/, %{target: target}, state do
    state.session |> fill_in(Query.css("input[name=\"key_result[target]\"]"), with: "95")
  end

  defand ~r/^I set the name to "(?<name>[^"]+)"$/, %{name: name}, state do
    state.session |> fill_in(Query.text_field("Name"), with: name)
  end

  defand ~r/^I set the description to "(?<description>[^"]+)"$/, %{description: description}, state do
    state.session |> fill_in(Query.text_field("Description"), with: description)
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the key results list$/, %{name: name}, state do
    state.session |> assert_text(name)
  end

  defand ~r/^I click on Add$/, _vars, state do
    state.session |> click(Query.button("Add"))
  end

  defwhen ~r/^I click on Add Objective$/, _vars, state do
    state.session |> click(Query.link("Add Objective"))
  end

  defand ~r/^I click Add Key Result$/, _vars, state do
    state.session |> click(Query.link("Add Key Result"))
  end

  defwhen ~r/^I select "(?<name>[^"]+)" from the Focus dropdown$/, %{name: name}, state do
    state.session |> select(name, from: "Focus On")
  end

end
