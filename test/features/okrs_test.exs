defmodule MyApp.Features.OkrsTest do
  use Operately.FeatureCase, file: "okrs.feature"

  alias Operately.OkrsFixtures
  alias Operately.PeopleFixtures
  alias Operately.ProjectsFixtures

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
    state.session
    |> fill_in(Query.css("#owner"), with: "John")
    |> assert_text("John Johnson")
    |> send_keys([:enter])
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of Objectives$/, %{name: name}, state do
    state.session |> visit("/objectives") |> assert_text(name)
  end

  defwhen ~r/^I click on the "(?<name>[^"]+)" objective$/, %{name: name}, state do
    state.session |> click(Query.link(name))
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

  defand ~r/^I have an objective called "(?<name>[^"]+)" owned by "(?<person_name>[^"]+)" with a description of "(?<description>[^"]+)"$/, %{name: name, person_name: person_name, description: description}, state do
    person = Operately.People.get_person_by_name!(person_name)

    OkrsFixtures.objective_fixture(%{
      name: name,
      description: description,
      ownership: %{
        target_type: :objective,
        person_id: person.id
      }
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

  defand ~r/^I click on Save$/, _vars, state do
    state.session |> click(Query.button("Save"))
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

  defand ~r/^I should see "(?<name>[^"]+)" as the Objective owner$/, %{name: name}, state do
    state.session |> assert_text(name)
  end

  defand ~r/^I have a key result called "(?<name>[^"]+)" for the "(?<objective>[^"]+)" objective$/, %{name: name, objective: objecive}, state do
    objective = Operately.Okrs.get_objective_by_name!(objecive)

    OkrsFixtures.key_result_fixture(%{
      name: name,
      objective_id: objective.id
    })
  end

  defand ~r/^I am on the "(?<name>[^"]+)" Objective page$/, %{name: name}, state do
    objective = Operately.Okrs.get_objective_by_name!(name)

    state.session
    |> visit("/objectives/#{objective.id}")
    |> wait_for_page_to_load("/objectives/#{objective.id}")
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the "(?<objective>[^"]+)" Objective key results$/, %{name: name, objective: objective}, state do
    state.session |> take_screenshot()
    state.session |> assert_text(name)
  end

  defand ~r/^I should see that "(?<name>[^"]+)" has status "(?<status>[^"]+)"$/, %{name: name, status: status}, state do
    state.session |> assert_text(status)
  end

  defand ~r/^I have a project called "(?<name>[^"]+)" for the "(?<objective>[^"]+)" objective championed by "(?<champion>[^"]+)"$/, %{name: name, objective: objective, champion: champion}, state do
    objective = Operately.Okrs.get_objective_by_name!(objective)
    champion = Operately.People.get_person_by_name!(champion)

    project = ProjectsFixtures.project_fixture(%{
      name: name,
      ownership: %{
        target_type: :project,
        person_id: champion.id
      }
    })

    {:ok, _} = Operately.Alignments.create_alignment(%{
      child: project.id,
      child_type: :project,
      parent: objective.id,
      parent_type: :objective,
    })
  end

  defthen ~r/^I should see "(?<project>[^"]+)" in the "(?<objective>[^"]+)" Objective projects$/, %{project: project, objective: objective}, state do
    state.session |> assert_text(project)
  end

  defand ~r/^I should see that "(?<champion>[^"]+)" is the champion of "(?<project>[^"]+)"$/, %{champion: champion, project: project}, state do
    state.session |> assert_text(champion)
  end

end
