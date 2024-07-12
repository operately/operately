defmodule Operately.Features.SpacesTest do
  use Operately.FeatureCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.Features.SpaceSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "listing existing space", ctx do
    ctx
    |> Steps.given_two_spaces_exists()
    |> Steps.visit_home()
    |> Steps.assert_all_spaces_are_listed()
  end

  feature "creating a new space", ctx do
    params = %{
      name: "Marketing",
      mission: "Let the world know about our products",
      color: "text-green-500",
      icon: "IconBolt"
    }

    ctx
    |> Steps.visit_home()
    |> Steps.click_on_add_space()
    |> Steps.fill_in_space_form(params)
    |> Steps.submit_space_form()
    |> Steps.assert_space_created(params)
    |> Steps.assert_creator_is_space_member(params)
  end

  feature "listing space members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    Operately.Groups.add_members(group.id, [%{
      id: person.id,
      permissions: Binding.edit_access(),
    }])

    ctx
    |> Steps.visit_home()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.assert_has(Query.text(person.full_name))
  end

  feature "joining a space", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture_with_account(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> UI.login_as(person)
    |> UI.visit(Paths.space_path(ctx.company, group))
    |> UI.click(testid: "join-space-button")
    |> UI.sleep(100)
    |> UI.visit(Paths.space_path(ctx.company, group))
    |> UI.assert_text("Mati A. joined the space")

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.person.id end) != nil
  end

  feature "adding space members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> Steps.visit_home()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.click(testid: "add-space-members")
    |> UI.fill_in(Query.css("#people-search"), with: "Mati")
    |> UI.assert_text("Mati Aharoni")
    |> UI.send_keys([:enter])
    |> UI.click(testid: "submit-space-members")
    |> UI.assert_has(title: person.full_name)
  end

  feature "removing space members", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    person = person_fixture(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    Operately.Groups.add_members(group.id, [%{
      id: person.id,
      permissions: Binding.edit_access(),
    }])

    ctx
    |> Steps.visit_home()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "add-remove-members")
    |> UI.assert_text(person.full_name)
    |> UI.click(testid: "remove-member-#{Paths.person_id(person)}")
    |> UI.sleep(100)
    |> UI.refute_text(person.full_name)
  end

  feature "listing projects in a space", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing"})
    project1 = project_fixture(%{name: "Project 1", company_id: ctx.company.id, creator_id: ctx.person.id, group_id: group.id})
    project2 = project_fixture(%{name: "Project 2", company_id: ctx.company.id, creator_id: ctx.person.id, group_id: group.id})

    ctx
    |> Steps.visit_home()
    |> UI.click(title: group.name)
    |> UI.click(testid: "projects-tab")
    |> UI.assert_text(project1.name)
    |> UI.assert_text(project2.name)
  end

  feature "editing space's name and purpose", ctx do
    group = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products"})

    ctx
    |> Steps.visit_home()
    |> UI.click(title: group.name)
    |> UI.click(testid: "space-settings")
    |> UI.click(testid: "edit-name-and-purpose")
    |> UI.fill_in(Query.text_field("Name"), with: "Marketing 2")
    |> UI.fill_in(Query.text_field("Purpose"), with: "Let the world know about our products 2")
    |> UI.click(testid: "save")
    |> UI.assert_has(Query.text("Marketing 2", count: 2))
    |> UI.assert_has(Query.text("Let the world know about our products 2"))
  end
end
