defmodule MyApp.Features.GoalPageTests do
  use Operately.FeatureCase

  setup session do
    session = session |> UI.login() |> visit_page()

    {:ok, %{session: session}}
  end

  feature "adding goals and targets", state do
    goal = "Increase retention rate"
    target1 = "Expand the customer success team by 50%"
    target2 = "Reduce the number of bugs in the product by 50%"

    state
    |> click_add_goal()
    |> fill_goal_form(goal)
    |> fill_target_form(target1)
    |> fill_target_form(target2)

    state
    |> UI.assert_text(goal)
    |> UI.assert_text(target1)
    |> UI.assert_text(target1)
  end

  feature "assigning goal champions", state do
    person = create_person("John Doe")
    objective = create_goal("Increase retention rate")

    state
    |> click_on_the_champion()
    |> choose_champion("John Doe")

    assert_goal_champion(state, "John Doe")
  end

  # ===========================================================================

  defp create_goal(name) do
    Operately.OkrsFixtures.objective_fixture(%{name: name})
  end

  defp create_person(name) do
    Operately.PeopleFixtures.person_fixture(%{full_name: name})
  end

  defp visit_page(state) do
    UI.visit(state, "/objectives")
  end

  defp click_add_goal(state) do
    state |> UI.click(testid: "addGoalButton")
  end

  defp fill_goal_form(state, name) do
    state
    |> UI.fill(testid: "goalFormNameInput", with: name)
    |> UI.send_keys([:enter])
  end

  defp fill_target_form(state, name) do
    state
    |> UI.fill(testid: "targetFormNameInput", with: name)
    |> UI.send_keys([:enter])
  end

  defp assert_goal_is_added_to_the_list(state, name) do
    state |> UI.assert_text(name, testid: "goalList")
  end

  defp click_on_the_champion(state) do
    state |> UI.click(testid: "goalChampion")
  end

  defp choose_champion(state, name) do
    UI.click(state, title: name, in: UI.find(state, testid: "championSelect"))
  end

  defp assert_goal_champion(state, name) do
    UI.assert_has(state, title: name, in: UI.find(state, testid: "goalChampion"))
  end
end
