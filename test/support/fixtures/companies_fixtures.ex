defmodule Operately.CompaniesFixtures do
  def company_fixture(attrs \\ %{}) do
    attrs = attrs |> Enum.into(%{
      mission: "some mission",
      name: "some name",
      trusted_email_domains: []
    })

    {:ok, company} = Operately.Companies.create_company(attrs)
    company
  end
end
