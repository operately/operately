defmodule Operately.Operations.CompanyMemberConvertingToGuestTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  alias Operately.{Access, Repo}
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Companies.Company
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:member)
  end

  test "converts a company member to guest", ctx do
    {:ok, person} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)

    assert person.type == :guest
    refute person.suspended
  end

  test "removes all access memberships and recreates guest access group", ctx do
    old_group = Access.get_group!(person_id: ctx.member.id)

    assert_member_has_admin_access_to_company(ctx)
    assert_member_has_edit_access_to_company_space(ctx)

    {:ok, _person} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)

    new_group = Access.get_group!(person_id: ctx.member.id)

    refute new_group.id == old_group.id
    refute Repo.get(Access.Group, old_group.id)

    # After conversion, the person should belong only to their new personal group.
    memberships =
      from(m in Access.GroupMembership, where: m.person_id == ^ctx.member.id)
      |> Repo.all()

    assert Enum.map(memberships, & &1.group_id) == [new_group.id]

    assert_member_has_view_access_to_company(ctx)
    assert_member_has_no_access_to_company_space(ctx)
  end

  test "creates activity and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)
    end)

    activity =
      from(a in Activity, where: a.action == "company_member_converted_to_guest" and a.content["person_id"] == ^ctx.member.id)
      |> Repo.one()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["person_id"] == ctx.member.id
    assert notifications_count() == 0

    perform_job(activity.id)

    [notification] = fetch_notifications(activity.id)

    assert notification.person_id == ctx.member.id
    assert notification.should_send_email
  end

  test "removes explicit access to space, project, and goal after converting to guest", ctx do
    ctx =
      ctx
      |> Factory.add_space(:private_space, company_permissions: Binding.no_access())
      |> Factory.add_project(:private_project, :private_space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_goal(:private_goal, :private_space, company_access: Binding.no_access(), space_access: Binding.no_access())

    grant_member_access_to_private_resources(ctx)
    assert_member_has_access_to_private_resources(ctx)

    {:ok, _} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)

    assert_member_has_no_access_to_private_resources(ctx)
  end

  test "returns errors for invalid conversions", ctx do
    # Guardrails: cannot convert yourself
    assert {:error, :cannot_convert_self} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.member, ctx.member)
  end

  defp assert_member_has_admin_access_to_company(ctx) do
    company_context = Access.get_context!(company_id: ctx.company.id)

    {:ok, _} = Access.bind(company_context, person_id: ctx.member.id, level: Binding.admin_access())

    company = Company.get!(ctx.member, id: ctx.company.id)
    assert company.request_info.access_level == Binding.admin_access()
  end

  defp assert_member_has_edit_access_to_company_space(ctx) do
    space = Group.get!(ctx.member, id: ctx.company.company_space_id)
    assert space.request_info.access_level == Binding.edit_access()
  end

  defp assert_member_has_view_access_to_company(ctx) do
    company = Company.get!(ctx.member, id: ctx.company.id, opts: [
      required_access_level: Binding.minimal_access()
    ])
    assert company.request_info.access_level == Binding.minimal_access()
  end

  defp assert_member_has_no_access_to_company_space(ctx) do
    assert {:error, :not_found} = Group.get(ctx.member, id: ctx.company.company_space_id)
  end

  defp grant_member_access_to_private_resources(ctx) do
    space_context = Access.get_context!(group_id: ctx.private_space.id)
    project_context = Access.get_context!(project_id: ctx.private_project.id)
    goal_context = Access.get_context!(goal_id: ctx.private_goal.id)

    {:ok, _} = Access.bind(space_context, person_id: ctx.member.id, level: Binding.edit_access())
    {:ok, _} = Access.bind(project_context, person_id: ctx.member.id, level: Binding.edit_access())
    {:ok, _} = Access.bind(goal_context, person_id: ctx.member.id, level: Binding.edit_access())
  end

  defp assert_member_has_access_to_private_resources(ctx) do
    {:ok, space} = Group.get(ctx.member, id: ctx.private_space.id)
    {:ok, project} = Project.get(ctx.member, id: ctx.private_project.id)
    {:ok, goal} = Goal.get(ctx.member, id: ctx.private_goal.id)

    assert space.request_info.access_level == Binding.edit_access()
    assert project.request_info.access_level == Binding.edit_access()
    assert goal.request_info.access_level == Binding.edit_access()
  end

  defp assert_member_has_no_access_to_private_resources(ctx) do
    assert {:error, :not_found} = Group.get(ctx.member, id: ctx.private_space.id)
    assert {:error, :not_found} = Project.get(ctx.member, id: ctx.private_project.id)
    assert {:error, :not_found} = Goal.get(ctx.member, id: ctx.private_goal.id)
  end
end
