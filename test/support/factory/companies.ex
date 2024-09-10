defmodule Operately.Support.Factory.Companies do

  def add_company(ctx, testid, account, opts \\ []) do
    name = Keyword.get(opts, :name, "Acme Inc.")
    mission = Keyword.get(opts, :mission, "Providing the best products")
    creator_title = Keyword.get(opts, :creator_title, "Founder")

    attrs = %{
      company_name: name,
      mission: mission,
      title: creator_title,
      trusted_email_domains: [],
    }

    {:ok, company} = Operately.Companies.create_company(attrs, account)

    Map.put(ctx, testid, company)
  end

  def add_company_member(ctx, testid, opts \\ []) do
    name = Keyword.get(opts, :name, "John Doe")

    attrs = %{
      company_id: ctx.company.id,
      name: name,
    }

    person = Operately.PeopleFixtures.person_fixture_with_account(attrs)

    Map.put(ctx, testid, person)
  end

end
