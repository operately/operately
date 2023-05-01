defmodule MyApp.Features.CompanyPageTest do
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
    create_person("John Doe")
    create_goal("Increase retention rate")

    state
    |> visit_page()
    |> click_on_the_goal_champion()
    |> choose_champion("John Doe")

    assert_goal_champion(state, "John Doe")
  end

  feature "assigning target champions", state do
    goal = "Increase retention rate"
    target = "Expand the customer success team by 50%"

    create_person("John Doe")
    create_goal_with_targets(goal, [target])

    state
    |> visit_page()
    |> click_on_the_target_champion()
    |> choose_champion("John Doe")

    assert_target_champion(state, "John Doe")
  end

  feature "creating a new profile and assigning as champion", state do
    create_goal("Increase retention rate")

    state
    |> visit_page()
    |> click_on_the_goal_champion()
    |> click_create_new_profile()
    |> fill_person_form("Susan Doe", "Head of Customer Success")
    |> click_create_and_assign()

    assert_goal_champion(state, "Susan Doe")
  end

  feature "unassigning existing champion", state do
    person = create_person("John Doe")
    create_goal("Increase retention rate", champion: person)

    state
    |> visit_page()
    |> click_on_the_goal_champion()
    |> click_unassign()

    assert_goal_champion(state, "Unassigned")
  end

  # ===========================================================================

  defp create_goal(name) do
    Operately.OkrsFixtures.objective_fixture(%{name: name})
  end

  defp create_goal(name, champion: champion) do
    Operately.OkrsFixtures.objective_fixture(%{name: name, owner_id: champion.id})
  end

  defp create_goal_with_targets(name, targets) do
    goal = create_goal(name)

    Enum.each(targets, fn target ->
      Operately.OkrsFixtures.key_result_fixture(%{name: target, objective_id: goal.id})
    end)

    goal
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

  defp click_on_the_goal_champion(state) do
    state |> UI.click(testid: "goalChampion")
  end

  defp click_on_the_target_champion(state) do
    state |> UI.click(testid: "targetChampion")
  end

  defp choose_champion(state, name) do
    UI.click(state, title: name, in: UI.find(state, testid: "championSelect"))
  end

  defp assert_goal_champion(state, name) do
    UI.assert_has(state, title: name, in: UI.find(state, testid: "goalChampion"))
  end

  defp assert_target_champion(state, name) do
    UI.assert_has(state, title: name, in: UI.find(state, testid: "targetChampion"))
  end

  defp click_create_new_profile(state) do
    state |> UI.click(testid: "createNewProfile")
  end

  defp fill_person_form(state, name, title) do
    state
    |> UI.fill(testid: "personFormNameInput", with: name)
    |> UI.fill(testid: "personFormTitleInput", with: title)
  end

  defp click_create_and_assign(state) do
    state |> UI.click(testid: "createAndAssign")
  end

  defp click_unassign(state) do
    state |> UI.click(testid: "unassignChampion")
  end
end
