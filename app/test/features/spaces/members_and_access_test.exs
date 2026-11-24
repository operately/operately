defmodule Operately.Features.Spaces.MembersAndAccessTest do
  use Operately.FeatureCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding
  alias Operately.Support.Features.SpacesSteps, as: Steps
  alias Operately.Support.Features.Spaces.MembersAndAccessSteps, as: AccessSteps

  setup ctx, do: Steps.setup(ctx)

  feature "membership changes refresh inherited access without reloading", ctx do
    ctx
    |> AccessSteps.given_inherited_access()
    |> AccessSteps.visit_access_management()
    |> AccessSteps.assert_inherited_access()
    |> AccessSteps.add_member()
    |> AccessSteps.assert_no_inherited_access()
    |> AccessSteps.remove_member()
    |> AccessSteps.assert_page_was_not_reloaded()
  end

  feature "changing general access refreshes inherited access after returning", ctx do
    ctx
    |> AccessSteps.given_inherited_access()
    |> AccessSteps.visit_access_management()
    |> AccessSteps.assert_inherited_access()
    |> AccessSteps.remove_general_company_access()
    |> AccessSteps.assert_no_inherited_access()
    |> AccessSteps.assert_page_was_not_reloaded()
  end

  feature "joining a space", ctx do
    group = group_fixture(ctx.creator, %{name: "Marketing", company_permissions: Binding.view_access()})
    person = person_fixture_with_account(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> UI.login_as(person)
    |> UI.visit(Paths.space_path(ctx.company, group))
    |> Steps.set_page_reload_marker()
    |> UI.click(testid: "join-space-button")
    |> UI.refute_has(testid: "join-space-button")
    |> UI.assert_text("Mati joined the space")
    |> Steps.assert_page_was_not_reloaded()

    members = Operately.Groups.list_members(group)
    assert Enum.any?(members, &(&1.id == person.id))
  end

  feature "adding space members", ctx do
    member1 = person_fixture_with_account(%{full_name: "Alex Aleksej", company_id: ctx.company.id})
    member2 = person_fixture_with_account(%{full_name: "Boby Brown", company_id: ctx.company.id})
    member3 = person_fixture_with_account(%{full_name: "Cathy Clarkson", company_id: ctx.company.id})

    members = [member1, member2, member3]

    ctx
    |> Steps.given_a_space_exists()
    |> Steps.add_new_members(members)
    |> Steps.assert_members_added(members)
    |> Steps.assert_members_added_notification_sent(members)
    |> Steps.assert_members_added_email_sent(members)
  end

  feature "adding members on a mobile screen keeps the form compact", ctx do
    first = person_fixture_with_account(%{full_name: "Alexandra Catherine Montgomery Richardson", company_id: ctx.company.id})
    removed = person_fixture_with_account(%{full_name: "Boby Brown", company_id: ctx.company.id})
    last = person_fixture_with_account(%{full_name: "Cathy Clarkson", company_id: ctx.company.id})

    ctx
    |> Steps.given_a_space_exists()
    |> AccessSteps.open_mobile_add_members_form()
    |> AccessSteps.assert_compact_member_layout(1)
    |> AccessSteps.select_member({0, first})
    |> AccessSteps.add_another_member()
    |> AccessSteps.select_member({1, removed})
    |> AccessSteps.add_another_member()
    |> AccessSteps.select_member({2, last})
    |> AccessSteps.select_member_access({2, "View Access"})
    |> AccessSteps.assert_compact_member_layout(3)
    |> AccessSteps.set_viewport({440, 850})
    |> AccessSteps.use_dark_theme()
    |> AccessSteps.assert_compact_member_layout(3)
    |> AccessSteps.set_viewport({1280, 1300})
    |> AccessSteps.use_light_theme()
    |> AccessSteps.assert_compact_member_layout(3)
    |> AccessSteps.remove_additional_member(1)
    |> AccessSteps.assert_compact_member_layout(2)
    |> AccessSteps.submit_members()
    |> Steps.assert_members_added([first, last])
    |> AccessSteps.assert_saved_member_access({last, Binding.view_access()})
    |> AccessSteps.assert_person_is_not_a_member(removed)
  end

  feature "removing space members", ctx do
    [space, member] =
      Steps.given_space_with_member_exists(ctx, %{
        person_name: "Mati Aharoni",
        space_name: "Marketing"
      })

    ctx
    |> Steps.visit_home()
    |> Steps.visit_access_management(space.name)
    |> Steps.remove_member(member)
    |> Steps.assert_member_removed(member)
  end

  feature "promoting member to space manager", ctx do
    [space, member] =
      Steps.given_space_with_member_exists(ctx, %{
        person_name: "Mati Aharoni",
        space_name: "Marketing"
      })

    ctx
    |> Steps.visit_home()
    |> Steps.visit_access_management(space.name)
    |> Steps.promote_to_manager(member)
    |> Steps.assert_member_promoted(member)
  end

  feature "demoting manager to member", ctx do
    [space, member] =
      Steps.given_space_with_member_exists(ctx, %{
        person_name: "Mati Aharoni",
        space_name: "Marketing",
        access_level: Binding.full_access()
      })

    ctx
    |> Steps.visit_home()
    |> Steps.visit_access_management(space.name)
    |> Steps.demote_to_member(member)
    |> Steps.assert_member_demoted(member)
  end

  feature "change access level of member", ctx do
    [space, member] =
      Steps.given_space_with_member_exists(ctx, %{
        person_name: "Mati Aharoni",
        space_name: "Marketing",
        access_level: Binding.comment_access()
      })

    ctx
    |> Steps.visit_home()
    |> Steps.visit_access_management(space.name)
    |> Steps.change_access_level(%{member: member, access_level: "edit"})
    |> Steps.assert_access_level_changed("edit")
  end
end
