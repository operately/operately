defmodule Operately.Features.GroupsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  setup state do
    company = company_fixture(%{name: "Test Org"})
    session = state.session |> UI.login()

    {:ok, %{session: session, company: company}}
  end

  feature "listing existing groups", state do
    group1 = group_fixture(%{name: "Marketing", mission: "Let the world know about our products"})
    group2 = group_fixture(%{name: "Engineering", mission: "Build the best product"})

    state
    |> visit_page()
    |> assert_has(Query.text(group1.name))
    |> assert_has(Query.text(group1.mission))
    |> assert_has(Query.text(group2.name))
    |> assert_has(Query.text(group2.mission))
  end

  feature "creating a new group", state do
    state
    |> visit_page()
    |> UI.click(testid: "add-group")
    |> fill_in(Query.text_field("Name"), with: "Marketing")
    |> fill_in(Query.text_field("Mission"), with: "Let the world know about our products")
    |> click(Query.button("Create Group"))
    |> assert_has(Query.text("Marketing"))
    |> assert_has(Query.text("Let the world know about our products"))
  end

  feature "listing group members", state do
    group = group_fixture(%{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: state.company.id})

    Operately.Groups.add_member(group, person.id)

    state
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "group-members")
    |> assert_has(Query.text(person.full_name))
  end

  feature "removing group members", state do
    group = group_fixture(%{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: state.company.id})

    Operately.Groups.add_member(group, person.id)

    state
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "group-members")
    |> assert_has(Query.text(person.full_name))
    |> UI.click(testid: "remove-member-#{person.id}")
    |> refute_has(Query.text(person.full_name))
  end

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
