defmodule Operately.Operations.CompanyAdminAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities.Activity
  alias Operately.Operations.CompanyAdminAdding

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})
    people = Enum.map(1..3, fn _ ->
      person_fixture_with_account(%{company_id: company.id})
    end)

    {:ok, company: company, admin: admin, people: people}
  end

  test "CompanyAdminAdding operation promotes people to admin", ctx do
    refute_people_are_admins(ctx.company, ctx.people)

    assert {:ok, _} = CompanyAdminAdding.run(ctx.admin, people_ids(ctx.people))

    assert_people_are_admins(ctx.company, ctx.people)
  end

  test "CompanyAdminAdding operation creates activity", ctx do
    assert {:ok, _} = CompanyAdminAdding.run(ctx.admin, people_ids(ctx.people))
    assert activity = find_activity(ctx.company)

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
      assert {:ok, _} = CompanyAdminAdding.run(ctx.admin, people_ids(ctx.people))
    end)

    assert activity = find_activity(ctx.company)

    assert notifications_count() == 0

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert notifications_count() == length(ctx.people)
  end

  #
  # Helpers
  #

  defp people_ids(people) do
    Enum.map(people, &(&1.id))
  end

  defp refute_people_are_admins(company, people) do
    admins = Operately.Companies.list_admins(company)
    admin_ids = Enum.map(admins, &(&1.id))

    refute Enum.any?(people, fn p -> p.id in admin_ids end)
  end

  defp assert_people_are_admins(company, people) do
    admins = Operately.Companies.list_admins(company)
    admin_ids = Enum.map(admins, &(&1.id))

    assert Enum.all?(people, fn p -> p.id in admin_ids end)
  end

  defp find_activity(company) do
    from(a in Activity, where: a.action == "company_admin_added" and a.content["company_id"] == ^company.id) |> Repo.one()
  end
end
