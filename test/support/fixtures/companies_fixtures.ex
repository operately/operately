defmodule Operately.CompaniesFixtures do
  def company_fixture(attrs \\ %{}) do
    attrs = attrs |> Enum.into(%{
      mission: "some mission",
      name: "some name",
      trusted_email_domains: []
    })

    {:ok, company} =
      Operately.Companies.Company.changeset(attrs)
      |> Operately.Repo.insert()

    company
  end
end
