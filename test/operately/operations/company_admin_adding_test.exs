defmodule Operately.Operations.CompanyAdminAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})
    people = Enum.map(1..3, fn _ ->
      person_fixture_with_account(%{company_id: company.id})
    end)

    {:ok, company: company, admin: admin, people: people}
  end

  test "CompanyAdminAdding operation updates people to admin", ctx do
    Enum.each(ctx.people, fn p ->
      assert p.company_role != :admin
    end)

    ids = Enum.map(ctx.people, &(&1.id))
    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, ids)

    Enum.each(ctx.people, fn p ->
      person = Repo.reload(p)
      assert person.company_role == :admin
    end)
  end

  test "CompanyAdminAdding operation adds person to admins group", ctx do
    group = Access.get_group!(company_id: ctx.company.id, tag: :full_access)

    Enum.each(ctx.people, fn p ->
      refute Access.get_group_membership(group_id: group.id, person_id: p.id)
    end)

    ids = Enum.map(ctx.people, &(&1.id))
    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, ids)

    Enum.each(ctx.people, fn p ->
      assert Access.get_group_membership(group_id: group.id, person_id: p.id)
    end)
  end

  test "CompanyAdminAdding operation creates activity", ctx do
    ids = Enum.map(ctx.people, &(&1.id))
    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, ids)

    activity = from(a in Activity, where: a.action == "company_admin_added" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.author_id == ctx.admin.id
    assert activity.content["company_id"] == ctx.company.id
    assert length(activity.content["people"]) == length(ctx.people)
    Enum.each(ctx.people, fn p ->
      content_p = Enum.find(activity.content["people"], &(&1["id"] == p.id))
      assert content_p["email"] == p.email
      assert content_p["full_name"] == p.full_name
    end)
  end

  test "CompanyAdminAdding operation creates notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      ids = Enum.map(ctx.people, &(&1.id))
      {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, ids)
    end)

    activity = from(a in Activity, where: a.action == "company_admin_added" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert notifications_count() == 0

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert notifications_count() == length(ctx.people)
  end
end
