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
    space1 = group_fixture(ctx.person, %{name: "Marketing", mission: "Let the world know about our products", company_permissions: Binding.view_access()})
    space2 = group_fixture(ctx.person, %{name: "Engineering", mission: "Build the best product", company_permissions: Binding.no_access()})

    Map.merge(ctx, %{spaces: [space1, space2]})
  end

  step :given_space_with_member_exists, ctx, attrs do
    space = group_fixture(ctx.person, %{name: attrs.space_name})
    member = person_fixture_with_account(%{full_name: attrs.person_name, company_id: ctx.company.id})

    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: member.id,
      access_level: attrs[:access_level] || Operately.Access.Binding.comment_access(),
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

    ctx
  end

  step :add_new_members, ctx, members do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.click(testid: "access-management")
    |> UI.click(testid: "add-members")
    
    ctx = Enum.reduce(Enum.with_index(members), ctx, fn {person, index}, ctx ->
      UI.find(ctx, UI.query(testid: "member-#{index}"), fn ctx ->
        UI.select_person_in(ctx, testid: "members-#{index}-personid", name: person.full_name)
      end)

      if index == length(members) - 1 do
        ctx
      else
        ctx |> UI.click(testid: "add-more")
      end
    end)

    ctx
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-access-management-page")
  end

  step :remove_member, ctx, person do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", person.full_name]))
    |> UI.click(testid: "remove-member")
    |> UI.sleep(500)
  end

  step :assert_members_added, ctx, members do
    ctx
    |> UI.find(UI.query(testid: "members-section"), fn ctx ->
      Enum.reduce(members, ctx, fn person, ctx ->
        ctx |> UI.assert_text(person.full_name)
      end)
    end)
  end

  step :assert_member_removed, ctx, person do
    ctx |> UI.refute_text(person.full_name)
  end

  step :assert_members_added_notification_sent, ctx, members do
    Enum.reduce(members, ctx, fn member, ctx ->
      ctx
      |> UI.login_as(member)
      |> NotificationsSteps.assert_space_members_added_sent(author: ctx.person, title: ctx.space.name)
    end)
  end

  step :assert_members_added_email_sent, ctx, members do
    Enum.reduce(members, ctx, fn member, ctx ->
      ctx
      |> EmailSteps.assert_space_members_added_sent(author: ctx.person, to: member, title: ctx.space.name)
    end)
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

  step :click_on_space, ctx do
    ctx |> UI.click(title: ctx.space.name)
  end

  step :assert_space_name_mission_and_privacy_indicator, ctx do
    ctx
    |> UI.assert_text(ctx.space.name)
    |> UI.assert_text(ctx.space.mission)
    |> UI.assert_has(testid: "secret-space-tooltip")
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

  step :assert_space_creationg_visible_in_activity_feed, ctx, attrs do
    space = Operately.Groups.get_group_by_name(attrs.name)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, space))
    |> UI.assert_feed_item(ctx.person, "created this space")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.person, "created the #{attrs.name} space")
  end

  step :assert_privacy_indicator_is_visible, ctx do
    ctx |> UI.assert_has(testid: "secret-space-tooltip")
  end

  step :promote_to_manager, ctx, member do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "promote-to-manager")
  end

  step :demote_to_member, ctx, member do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "demote-to-member")
  end

  step :assert_member_promoted, ctx, member do
    ctx
    |> UI.find(UI.query(testid: "space-managers-section"), fn ctx ->
      ctx |> UI.assert_text(member.full_name)
    end)
  end

  step :assert_member_demoted, ctx, member do
    ctx
    |> UI.find(UI.query(testid: "members-section"), fn ctx ->
      ctx |> UI.assert_text(member.full_name)
    end)
  end

  step :change_access_level, ctx, %{member: member, access_level: access_level} do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", member.full_name]))
    |> UI.click(testid: "change-access-level")
    |> UI.click(testid: "#{access_level}-access")
  end

  step :assert_access_level_changed, ctx, access_level do
    ctx |> UI.assert_has(testid: "#{access_level}-access-badge")
  end

end
