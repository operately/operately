defmodule Operately.Operations.CompanyMembersPermissionsEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Operations.CompanyMembersPermissionsEditing

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})

    members = [
      person_fixture_with_account(%{company_id: company.id}),
      person_fixture_with_account(%{company_id: company.id}),
      person_fixture_with_account(%{company_id: company.id}),
    ]

    {:ok, company: company, admin: admin, members: members}
  end

  test "CompanyMembersPermissionsEditing operation edits members' permissions", ctx do
    attrs = Enum.map(ctx.members, fn member ->
      %{id: member.id, access_level: Binding.edit_access()}
    end)

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, attrs)
    context = Access.get_context!(company_id: ctx.company.id)

    Enum.each(ctx.members, fn member ->
      access_group = Access.get_group!(person_id: member.id)

      assert Access.get_binding(context_id: context.id, group_id: access_group.id, access_level: Binding.edit_access())
      assert Access.get_binding(context_id: context.id, group_id: access_group.id)
    end)
  end

  test "CompanyMembersPermissionsEditing operation updates members' permissions", ctx do
    first_member = hd(ctx.members)
    second_member = Enum.at(ctx.members, 1)

    # Initial setup with view access
    initial_attrs = [
      %{id: first_member.id, access_level: Binding.view_access()},
      %{id: second_member.id, access_level: Binding.view_access()},
    ]

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, initial_attrs)
    context = Access.get_context!(company_id: ctx.company.id)

    # Update to edit access
    update_attrs = [
      %{id: first_member.id, access_level: Binding.edit_access()},
      %{id: second_member.id, access_level: Binding.full_access()},
    ]

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, update_attrs)

    first_group = Access.get_group!(person_id: first_member.id)
    second_group = Access.get_group!(person_id: second_member.id)

    assert Access.get_binding(context_id: context.id, group_id: first_group.id, access_level: Binding.edit_access())
    assert Access.get_binding(context_id: context.id, group_id: second_group.id, access_level: Binding.full_access())
  end

  test "CompanyMembersPermissionsEditing operation creates activity", ctx do
    attrs = Enum.map(ctx.members, fn member ->
      %{id: member.id, access_level: Binding.edit_access()}
    end)

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, attrs)

    activity = from(a in Activity, where: a.action == "company_members_permissions_edited" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.author_id == ctx.admin.id
    assert activity.content["company_id"] == ctx.company.id
    assert length(activity.content["members"]) == length(ctx.members)

    Enum.each(ctx.members, fn member ->
      content_member = Enum.find(activity.content["members"], &(&1["person_id"] == member.id))
      assert content_member["previous_access_level"] == Binding.no_access()
      assert content_member["updated_access_level"] == Binding.edit_access()
    end)
  end

  test "CompanyMembersPermissionsEditing operation only includes changed members in activity", ctx do
    first_member = hd(ctx.members)

    initial_attrs = [
      %{id: first_member.id, access_level: Binding.view_access()},
    ]

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, initial_attrs)

    # delete first activity
    activity = from(a in Activity, where: a.action == "company_members_permissions_edited" and a.content["company_id"] == ^ctx.company.id, order_by: [desc: a.inserted_at]) |> Repo.one()
    Repo.delete(activity)

    update_attrs = [
      %{id: first_member.id, access_level: Binding.edit_access()},
    ]

    {:ok, _} = CompanyMembersPermissionsEditing.run(ctx.admin, update_attrs)

    activity = from(a in Activity, where: a.action == "company_members_permissions_edited" and a.content["company_id"] == ^ctx.company.id, order_by: [desc: a.inserted_at]) |> Repo.one()

    # Only first_member should be in the activity with the access level change
    assert length(activity.content["members"]) == 1
    assert Enum.at(activity.content["members"], 0)["person_id"] == first_member.id
    assert Enum.at(activity.content["members"], 0)["previous_access_level"] == Binding.view_access()
    assert Enum.at(activity.content["members"], 0)["updated_access_level"] == Binding.edit_access()
  end
end
