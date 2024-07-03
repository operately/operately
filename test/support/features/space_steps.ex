defmodule Operately.Support.Features.SpaceSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :visit_home, ctx, do: UI.visit(ctx, Paths.home_path(ctx.company))

  step :given_two_spaces_exists, ctx do
    space1 = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products"})
    space2 = group_fixture(ctx.person, %{name: "Engineering", mission: "Build the best product"})

    Map.merge(ctx, %{spaces: [space1, space2]})
  end

  step :assert_all_spaces_are_listed, ctx do
    Enum.reduce(ctx.spaces, ctx, fn space, ctx ->
      ctx
      |> UI.assert_text(space.name)
      |> UI.assert_text(space.mission)
    end)
  end

  step :click_on_add_space, ctx, do: UI.click(ctx, testid: "add-space")

  step :fill_in_space_form, ctx, %{name: name, mission: mission, color: color, icon: icon} do
    ctx
    |> UI.fill_in(Query.text_field("Name"), with: name)
    |> UI.fill_in(Query.text_field("Purpose"), with: mission)
    |> UI.click(testid: "color-#{color}")
    |> UI.click(testid: "icon-#{icon}")
  end

  step :submit_space_form, ctx, do: UI.click(ctx, Query.button("Create Space"))

  step :assert_space_created, ctx, %{name: name, mission: mission, color: color, icon: icon} do
    group = Operately.Groups.get_group_by_name(name)

    assert group != nil
    assert group.color == color
    assert group.icon == icon

    ctx
    |> UI.assert_has(Query.text(name, count: 2))
    |> UI.assert_has(Query.text(mission))
  end

  step :assert_creator_is_space_member, ctx, %{name: name} do
    group = Operately.Groups.get_group_by_name(name)

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.person.id end) != nil
  end
end
