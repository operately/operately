defmodule Operately.Features.GroupsTest do
  use Operately.FeatureCase

  setup session do
    session = session |> UI.login() |> visit_page()

    {:ok, %{session: session}}
  end

  feature "creating a new group", state do
    state
    |> visit_page()
    |> click(Query.link("Add Group"))
    |> fill_in(Query.text_field("Name"), with: "Marketing")
    |> click(Query.button("Save"))
    |> assert_has(Query.text("Marketing"))
  end

  # feature "listing existing groups", state do
  #   group = create_group("Marketing")

  #   state
  #   |> visit_page()
  #   |> assert_has(Query.text(group.name))
  # end


  # feature "adding group members", state do
  #   group = create_group("Marketing")
  #   person = crete_person("Mati Aharoni")

  #   state
  #   |> visit_page()
  #   |> click(Query.link(group.name))
  #   |> click(Query.button("Add Members"))
  #   |> fill_in(Query.css("#peopleSearch"), with: "Mati")
  #   |> assert_text("Mati Aharoni")
  #   |> send_keys([:enter])
  #   |> find(Query.css(".ReactModalPortal"), fn modal ->
  #     click(modal, Query.button("Add Members"))
  #   end)
  #   |> UI.assert_has(title: person.full_name)
  # end

  # feature "setting group mission", state do
  #   mission = "Let the world know about our products"
  #   group = create_group("Marketing")

  #   state
  #   |> visit_page()
  #   |> click(Query.link(group.name))
  #   |> UI.click(testid: "editGroupMission")
  #   |> UI.fill(testid: "groupMissionTextarea", with: mission)
  #   |> click(Query.button("Save"))
  #   |> assert_has(Query.text(mission))
  # end

  # feature "adding points of contact", state do
  #   group = create_group("Marketing")

  #   state
  #   |> visit_page()
  #   |> UI.click_link(group.name)
  #   |> UI.click(testid: "groupAddPointOfContact")
  #   |> UI.fill(testid: "groupPointOfContactName", with: "#marketing")
  #   |> UI.fill(testid: "groupPointOfContactValue", with: "https://slack.com/marketing")
  #   |> UI.click_button("Save")
  #   |> UI.assert_text("#marketing")
  # end

  # feature "listing projects in a group", state do
  #   group = create_group("Marketing")

  #   project1 = create_project("Marketing Website", group: group)
  #   project2 = create_project("Marketing Campaign", group: group)

  #   state
  #   |> visit_page()
  #   |> UI.click_link(group.name)
  #   |> UI.assert_text(project1.name)
  #   |> UI.assert_text(project2.name)
  # end

  # feature "listing goals in a group", state do
  #   group = create_group("Marketing")

  #   goal1 = crete_goal("Increase traffic", group: group)
  #   goal2 = crete_goal("Raise brand awareness", group: group)

  #   state
  #   |> visit_page()
  #   |> UI.click_link(group.name)
  #   |> UI.assert_text(goal1.name)
  #   |> UI.assert_text(goal2.name)
  # end

  # # ===========================================================================

  defp visit_page(state) do
    UI.visit(state, "/groups")
  end

  # defp create_group(name) do
  #   Operately.GroupsFixtures.group_fixture(%{name: name})
  # end

  # defp crete_person(name) do
  #   Operately.PeopleFixtures.person_fixture(%{full_name: name})
  # end

  # defp create_project(name, group: group) do
  #   Operately.ProjectsFixtures.project_fixture(%{name: name, group_id: group.id})
  # end

  # defp crete_goal(name, group: group) do
  #   Operately.OkrsFixtures.objective_fixture(%{name: name, group_id: group.id})
  # end
end
