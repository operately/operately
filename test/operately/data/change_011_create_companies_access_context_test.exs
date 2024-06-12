defmodule Operately.Data.Change011CreateCompaniesAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change011CreateCompaniesAccessContext

  test "creates access_context for existing companies" do
    companies = Enum.map(1..5, fn _ ->
      company_fixture()
    end)

    Enum.each(companies, fn company ->
      assert nil == Repo.get_by(Context, company_id: company.id)
    end)

    Change011CreateCompaniesAccessContext.run()

    Enum.each(companies, fn company ->
      assert %Context{} = Repo.get_by(Context, company_id: company.id)
    end)
  end
end
