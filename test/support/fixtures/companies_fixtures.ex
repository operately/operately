defmodule Operately.CompaniesFixtures do
  import Operately.PeopleFixtures

  def company_fixture(attrs \\ %{}, creator \\ nil) do
    creator = creator || account_fixture()

    attrs = attrs |> Enum.into(%{
      mission: "some mission",
      company_name: "some name",
      trusted_email_domains: [],
      title: "Founder",
    })

    {:ok, company} = Operately.Companies.create_company(attrs, creator)

    company
  end
end
