defmodule Operately.ActivitiesTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities
  alias Operately.Activities.NotificationDispatcher

  @first_member_attrs %{
    full_name: "John Doe",
    email: "john@your-company.com",
    title: "Developer"
  }

  @second_member_attrs %{
    full_name: "Jane Doe",
    email: "jane@your-company.com",
    title: "Designer"
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "without_notification_dispatch only suppresses notification jobs within the callback", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _changes} =
               Activities.without_notification_dispatch(fn ->
                 Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @first_member_attrs)
               end)

      assert all_enqueued(worker: NotificationDispatcher) == []

      assert {:ok, _changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @second_member_attrs)

      assert length(all_enqueued(worker: NotificationDispatcher)) == 1
    end)
  end
end
