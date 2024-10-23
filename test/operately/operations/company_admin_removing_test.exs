defmodule Operately.Operations.CompanyAdminRemovingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    company_creator = Operately.Companies.list_owners(company) |> hd()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})

    {:ok, company: company, admin: admin, member: company_creator}
  end

  test "CompanyAdminRemoving operation creates activity", ctx do
    {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member)

    activity = from(a in Activity, where: a.action == "company_admin_removed" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.author_id == ctx.admin.id
    assert activity.content["person_id"] == ctx.member.id
  end

  test "CompanyAdminAdding operation creates notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = Operately.Operations.CompanyAdminRemoving.run(ctx.admin, ctx.member)
    end)

    activity = from(a in Activity, where: a.action == "company_admin_removed" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert notifications_count() == 0

    perform_job(activity.id)

    assert fetch_notification(activity.id)
    assert notifications_count() == 1
  end
end
