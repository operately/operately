defmodule Operately.Operations.GroupPermissionsEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator, %{
      public_permissions: Binding.view_access(),
      company_permissions: Binding.edit_access(),
    })

    {:ok, company: company, group: group, creator: creator}
  end

  test "GroupPermissionsEditing operation edits permissions", ctx do
    context = Access.get_context!(group_id: ctx.group.id)
    anonymous = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)
    members = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.view_access())
    assert Access.get_binding(context_id: context.id, group_id: members.id, access_level: Binding.edit_access())

    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(ctx.creator, ctx.group, %{
      public: Binding.no_access(),
      company: Binding.full_access(),
    })

    refute Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.view_access())
    refute Access.get_binding(context_id: context.id, group_id: members.id, access_level: Binding.edit_access())

    assert Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.no_access())
    assert Access.get_binding(context_id: context.id, group_id: members.id, access_level: Binding.full_access())
  end

  test "GroupPermissionsEditing operation works when there is no binding to anonymous group", ctx do
    group = group_fixture(ctx.creator, %{ company_permissions: Binding.edit_access() })

    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(ctx.creator, group, %{
      public: Binding.no_access(),
      company: Binding.full_access(),
    })
  end

  test "GroupPermissionsEditing operation creates activity", ctx do
    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(ctx.creator, ctx.group, %{
      public: Binding.no_access(),
      company: Binding.comment_access(),
    })

    activity = from(a in Activity, where: a.action == "space_permissions_edited" and a.content["space_id"] == ^ctx.group.id) |> Repo.one!()

    assert activity.content["previous_permissions"]["public"] == Binding.view_access()
    assert activity.content["previous_permissions"]["company"] == Binding.edit_access()

    assert activity.content["new_permissions"]["public"] == Binding.no_access()
    assert activity.content["new_permissions"]["company"] == Binding.comment_access()
  end
end
