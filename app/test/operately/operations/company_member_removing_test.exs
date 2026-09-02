defmodule Operately.Operations.CompanyMemberRemovingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities.Activity
  alias Operately.People.Person
  alias Operately.Repo

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "removes a member who has no title", ctx do
    member =
      person_fixture_with_account(%{
        company_id: ctx.company.id,
        title: nil,
        has_open_invitation: false
      })

    assert {:ok, removed} = Operately.Operations.CompanyMemberRemoving.run(ctx.admin, member.id)

    reloaded = Repo.get(Person, member.id)

    assert removed.id == member.id
    assert reloaded.suspended
    assert reloaded.suspended_at

    activity =
      from(a in Activity,
        where: a.action == "company_member_removed" and a.content["email"] == ^member.email
      )
      |> Repo.one!()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["name"] == member.full_name
    assert activity.content["title"] == nil
  end
end
