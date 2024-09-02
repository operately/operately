defmodule Operately.DemoTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  test "it creates a demo company without failures" do
    account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, _} = Operately.Demo.run("peter.parker@localhost")
    assert Operately.Companies.get_company_by_name("Acme Inc.")
  end
end
