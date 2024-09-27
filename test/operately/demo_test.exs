defmodule Operately.DemoTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  test "it creates a demo company without failures" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")
    assert %Operately.Companies.Company{} = company
    assert Operately.Companies.get_company_by_name("Acme Inc.")
  end
end
