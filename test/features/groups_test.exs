defmodule Operately.Features.GroupsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    {:ok, ctx}
  end

  feature "listing existing groups", ctx do
    group1 = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products"})
    group2 = group_fixture(ctx.person, %{name: "Engineering", mission: "Build the best product"})

    ctx
    |> visit_page()
    |> UI.assert_text(group1.name)
    |> UI.assert_text(group1.mission)
    |> UI.assert_text(group2.name)
    |> UI.assert_text(group2.mission)
  end

  feature "creating a new group", ctx do
    ctx
    |> visit_page()
    |> UI.click(testid: "add-group")
    |> UI.fill_in(Query.text_field("Name"), with: "Marketing")
    |> UI.fill_in(Query.text_field("Purpose"), with: "Let the world know about our products")
    |> UI.click(testid: "color-text-green-500")
    |> UI.click(testid: "icon-IconBolt")
    |> UI.click(Query.button("Create Space"))
    |> UI.assert_has(Query.text("Marketing", count: 2))
    |> UI.assert_has(Query.text("Let the world know about our products"))

    group = Operately.Groups.get_group_by_name("Marketing")
    assert group != nil
    assert group.color == "text-green-500"
    assert group.icon == "IconBolt"

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.person.id end) != nil
  end

  feature "listing group members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    Operately.Groups.add_member(group, person.id)

    ctx
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.assert_has(Query.text(person.full_name))
  end

  feature "joining a group", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture_with_account(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> UI.login_as(person)
    |> UI.visit("/spaces/#{group.id}")
    |> UI.click(testid: "join-space-button")
    |> UI.assert_text("Mati A. joined this space")

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.person.id end) != nil
  end

  feature "adding group members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.click(testid: "add-group-members")
    |> UI.fill_in(Query.css("#people-search"), with: "Mati")
    |> UI.assert_text("Mati Aharoni")
    |> UI.send_keys([:enter])
    |> UI.click(testid: "submit-group-members")
    |> UI.assert_has(title: person.full_name)
  end

  feature "removing group members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    Operately.Groups.add_member(group, person.id)

    ctx
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.assert_text(person.full_name)
    |> UI.click(testid: "remove-member-#{person.id}")
    |> UI.refute_text(person.full_name)
  end

  feature "listing projects in a group", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    project1 = project_fixture(%{name: "Project 1", company_id: ctx.company.id, creator_id: ctx.person.id, group_id: group.id})
    project2 = project_fixture(%{name: "Project 2", company_id: ctx.company.id, creator_id: ctx.person.id, group_id: group.id})

    ctx
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "projects-tab")
    |> UI.assert_text(project1.name)
    |> UI.assert_text(project2.name)
  end

  feature "editing group's name and purpose", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products"})

    ctx
    |> visit_page()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "edit-name-and-purpose")
    |> UI.fill_in(Query.text_field("Name"), with: "Marketing 2")
    |> UI.fill_in(Query.text_field("Purpose"), with: "Let the world know about our products 2")
    |> UI.click(testid: "save")
    |> UI.assert_page("/spaces/#{group.id}")
    |> UI.assert_has(Query.text("Marketing 2", count: 2))
    |> UI.assert_has(Query.text("Let the world know about our products 2"))
  end

  # # ===========================================================================

  defp visit_page(ctx) do
    UI.visit(ctx, "/")
  end
end
