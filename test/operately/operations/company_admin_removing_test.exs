defmodule Operately.Operations.CompanyAdminRemovingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    company_creator = Operately.Companies.list_admins(company.id) |> hd()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})

    {:ok, company: company, admin: admin, member: company_creator}
  end

  test "CompanyAdminRemoving operation updates admin to member", ctx do
    assert ctx.member.company_role == :admin

    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)

    member = Repo.reload(ctx.member)
    assert member.company_role == :member
  end

  test "CompanyAdminRemoving operation removes membership with admins group", ctx do
    group = Access.get_group!(company_id: ctx.company.id, tag: :full_access)

    assert Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)

    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)

    refute Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)
  end

  test "CompanyAdminRemoving operation adds membership with members group if it doesn't exist", ctx do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    {:ok, _} = Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)
      |> Access.delete_group_membership()

    refute Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)

    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)
    assert Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)

    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)
    assert Access.get_group_membership(group_id: group.id, person_id: ctx.member.id)
  end

  test "CompanyAdminRemoving operation creates activity", ctx do
    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)

    activity = from(a in Activity, where: a.action == "company_admin_removed" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.author_id == ctx.admin.id
    assert activity.content["person_id"] == ctx.member.id
  end

  test "CompanyAdminAdding operation creates notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member.id)
    end)

    activity = from(a in Activity, where: a.action == "company_admin_removed" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert notifications_count() == 0

    perform_job(activity.id)

    assert fetch_notification(activity.id)
    assert notifications_count() == 1
  end
end
