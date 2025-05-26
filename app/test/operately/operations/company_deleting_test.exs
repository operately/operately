defmodule Operately.Operations.CompanyDeletingTest do
  use Operately.DataCase

  setup do
    account =
      Operately.PeopleFixtures.account_fixture(%{
        full_name: "Peter Parker",
        email: "peter.parker@localhost"
      })

    {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    {:ok, company: company}
  end

  test "it deletes a company", ctx do
    assert {:ok, _} = Operately.Operations.CompanyDeleting.run(ctx.company.id)
    assert Operately.Companies.get_company!(ctx.company.id) == nil
  end
end
