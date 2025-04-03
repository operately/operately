defmodule Operately.Data.Change017CreateAccessGroupForAnonymousUsersTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Companies.Company

  test "creates access groups for anonymous users" do
    companies = Enum.map(1..3, fn _ ->
      create_company()
    end)

    Enum.each(companies, fn company ->
      assert nil == Access.get_group(company_id: company.id, tag: :anonymous)
    end)

    Operately.Data.Change017CreateAccessGroupForAnonymousUsers.run()

    Enum.each(companies, fn company ->
      assert nil != Access.get_group(company_id: company.id, tag: :anonymous)
    end)
  end

  #
  # Helpers
  #

  defp create_company do
    {:ok, company} =
      Company.changeset(%{name: "some name"})
      |> Repo.insert()

    company
  end
end
