defmodule Operately.Data.Change012CreateCompaniesAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Context
  alias Operately.Data.Change012CreateCompaniesAccessContext

  test "creates access_context for existing companies" do
    companies = Enum.map(1..5, fn _ ->
      create_company()
    end)

    Enum.each(companies, fn company ->
      assert nil == Repo.get_by(Context, company_id: company.id)
    end)

    Change012CreateCompaniesAccessContext.run()

    Enum.each(companies, fn company ->
      assert %Context{} = Repo.get_by(Context, company_id: company.id)
    end)
  end

  test "creates access_context successfully when a company already has access context" do
    company_with_context = company_fixture()
    company_without_context = create_company()

    assert nil != Access.get_context!(company_id: company_with_context.id)

    Change012CreateCompaniesAccessContext.run()

    assert nil != Access.get_context!(company_id: company_without_context.id)
  end

  defp create_company do
    {:ok, company} = Operately.Companies.Company.changeset(%{
      mission: "some mission",
      name: "some name",
      trusted_email_domains: []
    })
    |> Repo.insert()

    company
  end
end
