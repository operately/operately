defmodule Operately.Support.Features.SpaceSteps do
  use Operately.FeatureCase

  alias Operately.Companies
  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org"})
    admin = hd(Companies.list_admins(company.id))

    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})
    Companies.add_admin(admin, person.id)

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :visit_home, ctx, do: UI.visit(ctx, Paths.home_path(ctx.company))

  step :visit_access_management, ctx, name do
    ctx
    |> UI.click(title: name)
    |> UI.click(testid: "access-management")
  end

  step :given_two_spaces_exists, ctx do
    space1 = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products"})
    space2 = group_fixture(ctx.person, %{name: "Engineering", mission: "Build the best product"})

    Map.merge(ctx, %{spaces: [space1, space2]})
  end

  step :given_space_with_member_exists, ctx, attrs do
    space = group_fixture(ctx.person, %{name: attrs.space_name})
    member = person_fixture_with_account(%{full_name: attrs.person_name, company_id: ctx.company.id})

    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: member.id,
      permissions: Operately.Access.Binding.comment_access(),
    }])

    [space, member]
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
    |> UI.fill(testid: "name", with: name)
    |> UI.fill(testid: "mission", with: mission)
    |> UI.click(testid: "color-#{color}")
    |> UI.click(testid: "icon-#{icon}")
  end

  step :submit_space_form, ctx, do: UI.click(ctx, Query.button("Create Space"))

  step :assert_space_created, ctx, %{name: name, mission: mission, color: color, icon: icon} do
    UI.sleep(ctx, 500)

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

  step :add_new_member, ctx, attrs do
    ctx
    |> UI.fill_in(Query.css("#people-search"), with: attrs[:search])
    |> UI.assert_text(attrs[:name])
    |> UI.send_keys([:enter])
    |> UI.click(testid: "submit-space-members")
  end

  step :remove_member, ctx, person do
    id = OperatelyWeb.Paths.person_id(person)

    ctx
    |> UI.click(testid: "options-" <> id)
    |> UI.click(testid: "remove-" <> id)
    |> UI.sleep(500)
  end

  step :assert_member_added, ctx, name do
    ctx
    |> UI.find(UI.query(testid: "members-list"), fn members ->
        UI.assert_text(members, name)
    end)
  end

  step :assert_member_removed, ctx, person do
    ctx
    |> UI.refute_text(person.full_name, testid: "members-list")
  end

  step :assert_members_added_notification_sent, ctx, params do
    ctx
    |> UI.login_as(params[:member])
    |> NotificationsSteps.assert_space_members_added_sent(author: ctx.person, title: params[:title])
  end

  step :assert_members_added_email_sent, ctx, params do
    ctx
    |> EmailSteps.assert_space_members_added_sent(author: ctx.person, to: params[:member], title: params[:title])
  end

  step :given_a_space_exists, ctx do
    ctx |> Map.put(:space, group_fixture(ctx.person, %{name: "Marketing"}))
  end

  step :given_the_space_has_several_projects, ctx, names do
    Enum.map(names, fn name ->
      project_fixture(%{
        name: name, 
        company_id: ctx.company.id, 
        creator_id: ctx.person.id, 
        group_id: ctx.space.id,
      })
    end)

    ctx
  end

  step :given_the_space_has_several_space_wide_projects, ctx, names do
    Enum.map(names, fn name ->
      project_fixture(%{
        name: name, 
        company_id: ctx.company.id, 
        creator_id: ctx.person.id, 
        group_id: ctx.space.id,
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
        space_access_level: Binding.comment_access(),
      })
    end)

    ctx
  end

  step :when_clicking_on_projects_tab, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.click(testid: "projects-tab")
  end

  step :assert_projects_are_listed, ctx, names do
    Enum.reduce(names, ctx, fn name, ctx ->
      ctx |> UI.assert_text(name)
    end)
  end
end
