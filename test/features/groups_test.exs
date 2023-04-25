defmodule Operately.Features.GroupsTest do
  use Operately.FeatureCase, file: "groups.feature"

  alias Operately.Groups
  alias Operately.PeopleFixtures
  alias Operately.ProjectsFixtures

  import_steps(Operately.Features.SharedSteps.Login)
  import_steps(Operately.Features.SharedSteps.SimpleInteractions)

  defgiven ~r/^that a group with the name "(?<name>[^"]+)" exists$/, %{name: name}, %{session: session} do
    Groups.create_group(%{name: name})
  end

  defwhen ~r/^I visit the groups page$/, _vars, %{session: session} do
    session |> visit("/groups")
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of groups$/, %{name: name}, %{session: session} do
    session |> assert_has(Query.text(name))
  end

  defwhen ~r/^I create a new group with the name "(?<name>[^"]+)"$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link("Add Group"))
    |> fill_in(Query.text_field("Name"), with: name)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the new group "(?<name>[^"]+)" is listing on the groups page$/, %{name: name}, %{session: session} do
    wait_for_page_to_load(session, "/groups")
    session |> assert_has(Query.text(name))
  end

  defwhen ~r/^I edit the group "(?<old_name>[^"]+)" and change the name to "(?<new_name>[^"]+)"$/, %{old_name: old_name, new_name: new_name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link(old_name))
    |> click(Query.button("Edit"))
    |> fill_in(Query.text_field("Name"), with: new_name)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the group "(?<name>[^"]+)" is no longer visible on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> refute_has(Query.text(name))
  end

  defand ~r/^the group "(?<name>[^"]+)" is visible on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> assert_has(Query.text(name))
  end

  defwhen ~r/^I delete the group "(?<name>[^"]+)"$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link("Delete"))
  end

  defthen ~r/^the group "(?<name>[^"]+)" is not listing on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> refute_has(Query.text(name))
  end

  defand ~r/^I have "(?<person_name>[^"]+)" in my organization as the "(?<title>[^"]+)"$/, %{person_name: name, title: title}, state do
    PeopleFixtures.person_fixture(%{
      full_name: name,
      handle: name |> String.downcase |> String.replace(" ", "_"),
      title: title
    })
  end

  defwhen ~r/^I visit the group "(?<name>[^"]+)" page$/, %{name: name}, state do
    state.session
    |> visit("/groups")
    |> click(Query.link(name))
  end

  defand ~r/^I add the user "(?<name>[^"]+)" to the group$/, %{name: name}, state do
    state.session
    |> click(Query.button("Add Members"))
    |> fill_in(Query.css("#peopleSearch"), with: String.split(name, " ") |> List.first)
    |> assert_text(name)
    |> send_keys([:enter])
    |> find(Query.css(".ReactModalPortal"), fn modal ->
      click(modal, Query.button("Add Members"))
    end)
  end

  defthen ~r/^the user "(?<person>[^"]+)" is visible on the group "(?<group>[^"]+)" page$/, %{person: person, group: group}, state do
    state.session
    |> assert_has(Query.text(person))
  end

  defand ~r/^I set the mission to "(?<mission>[^"]+)"$/, %{mission: mission}, state do
    state.session
    |> find(Query.css("[data-test-id=\"group-mission\"]"), fn mission_element ->
      mission_element |> click(Query.css("a", text: "edit"))
    end)
    |> fill_in(Query.css("[data-test-id=\"group-mission-textarea\"]"), with: mission)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the mission of the group "(?<group>[^"]+)" is "(?<mission>[^"]+)"$/, %{mission: mission}, state do
    state.session
    |> find(Query.css("[data-test-id=\"group-mission\"]"), fn mission_element ->
      mission_element |> assert_has(Query.text(mission))
    end)
  end

  defand ~r/^I add a point of contact "(?<type>[^"]+)" with the value "(?<name>[^"]+)"$/, %{type: type, name: name}, state do
    state.session
    |> find(Query.css("[data-test-id=\"group-points-of-contact\"]"), fn poc_element ->
      poc_element |> click(Query.button("Add a Point of Contact"))
    end)
    |> fill_in(Query.css("[data-test-id=\"group-point-of-contact-type\"]"), with: type)
    |> fill_in(Query.css("[data-test-id=\"group-point-of-contact-name\"]"), with: name)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the point of contact "(?<name>[^"]+)" is visible on the group "(?<group>[^"]+)" page$/, %{name: name}, state do
    state.session
    |> assert_has(Query.text(name))
  end

  defgiven ~r/^that a project with the name "(?<name>[^"]+)" exists in the group "(?<group>[^"]+)"$/, %{name: name, group: group}, state do
    group = Groups.get_group_by_name(group)

    project = ProjectsFixtures.project_fixture(%{
      name: name,
      group_id: group.id
    })
  end

  defthen ~r/^I should see "(?<project>[^"]+)" in the list of projects$/, %{project: project}, state do
    state.session
    |> assert_has(Query.text(project))
  end

end
