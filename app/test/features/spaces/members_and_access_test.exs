defmodule Operately.Features.Spaces.MembersAndAccessTest do
  use Operately.FeatureCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding
  alias Operately.Support.Features.SpacesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "joining a space", ctx do
    group = group_fixture(ctx.creator, %{name: "Marketing", company_permissions: Binding.view_access()})
    person = person_fixture_with_account(%{full_name: "Mati Aharoni", company_id: ctx.company.id})

    ctx
    |> UI.login_as(person)
    |> UI.visit(Paths.space_path(ctx.company, group))
    |> UI.click(testid: "join-space-button")
    |> UI.sleep(300)
    |> UI.visit(Paths.space_path(ctx.company, group))
    |> UI.assert_text("Mati joined the space")

    members = Operately.Groups.list_members(group)
    assert Enum.find(members, fn member -> member.id == ctx.creator.id end) != nil
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
