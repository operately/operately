defmodule Operately.Operations.CompanyAdminAddingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})

    {:ok, company: company, admin: admin}
  end

  test "CompanyAdminAdding operation updates person to admin", ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id})

    assert person.company_role != :admin

    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, person.id)

    person = Repo.reload(person)
    assert person.company_role == :admin
  end

  test "CompanyAdminAdding operation adds person to admins group", ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id})
    group = Access.get_group!(company_id: ctx.company.id, tag: :full_access)

    refute Access.get_group_membership(group_id: group.id, person_id: person.id)

    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, person.id)

    assert Access.get_group_membership(group_id: group.id, person_id: person.id)
  end

  test "CompanyAdminAdding operation creates activity", ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id})

    {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.admin, person.id)

    activity = from(a in Activity, where: a.action == "company_admin_added" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.author_id == ctx.admin.id
    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["person_id"] == person.id
  end
end
