defmodule Operately.CompaniesFixtures do
  import Operately.PeopleFixtures

  def company_fixture(attrs \\ %{}) do
    creator = account_fixture()

    attrs = attrs |> Enum.into(%{
      mission: "some mission",
      company_name: "some name",
      trusted_email_domains: [],
      role: "Founder"
    })

    {:ok, company} = Operately.Companies.create_company(attrs, creator)

    company
  end
end
