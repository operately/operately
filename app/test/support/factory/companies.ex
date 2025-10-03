defmodule Operately.Support.Factory.Companies do
  alias Operately.Support.Factory.Utils

  def add_company(ctx, testid, account, opts \\ []) do
    name = Keyword.get(opts, :name, "Acme Inc.")
    mission = Keyword.get(opts, :mission, "Providing the best products")
    creator_title = Keyword.get(opts, :creator_title, "Founder")

    attrs = %{
      company_name: name,
      mission: mission,
      title: creator_title,
      trusted_email_domains: []
    }

    {:ok, company} = Operately.Companies.create_company(attrs, account)

    Map.put(ctx, testid, company)
  end

  def add_company_agent(ctx, testid, opts \\ []) do
    full_name = Keyword.get(opts, :full_name) || Utils.testid_to_name(testid)
    title = Keyword.get(opts, :title, "Agent")

    attrs = %{
      full_name: full_name,
      title: title
    }

    {:ok, agent} = Operately.Operations.AgentAdding.run(ctx.creator, attrs)

    Map.put(ctx, testid, agent)
  end

  def add_company_member(ctx, testid, opts \\ []) do
    name = Keyword.get(opts, :name) || Utils.testid_to_name(testid)
    account = Keyword.get(opts, :account) && Map.fetch!(ctx, opts[:account])

    if account do
      attrs =
        Enum.into(opts, %{
          company_id: ctx.company.id,
          full_name: name,
          account_id: account.id,
          email: account.email
        })

      person = Operately.PeopleFixtures.person_fixture(attrs)
      Map.put(ctx, testid, person)
    else
      attrs = Enum.into(opts, %{company_id: ctx.company.id, full_name: name})
      person = Operately.PeopleFixtures.person_fixture_with_account(attrs)
      Map.put(ctx, testid, person)
    end
  end

  def add_company_admin(ctx, testid, opts \\ []) do
    name = Keyword.get(opts, :name) || Utils.testid_to_name(testid)

    attrs = %{
      company_id: ctx.company.id,
      full_name: name
    }

    person = Operately.PeopleFixtures.person_fixture_with_account(attrs)

    set_access_level(ctx, person, Operately.Access.Binding.edit_access())

    Map.put(ctx, testid, person)
  end

  def add_company_owner(ctx, testid, opts \\ []) do
    name = Keyword.get(opts, :name) || Utils.testid_to_name(testid)

    attrs = %{
      company_id: ctx.company.id,
      full_name: name
    }

    person = Operately.PeopleFixtures.person_fixture_with_account(attrs)
    set_access_level(ctx, person, Operately.Access.Binding.full_access())

    group = Operately.Access.get_group(company_id: ctx.company.id, tag: :full_access)
    {:ok, _} = Operately.Access.add_to_group(group, person_id: person.id)

    Map.put(ctx, testid, person)
  end

  defp set_access_level(ctx, person, access_level) do
    context = Operately.Access.get_context(company_id: ctx.company.id)
    Operately.Access.bind(context, person_id: person.id, level: access_level)
  end

  def set_person_manager(ctx, testid, manager_key) do
    person = Map.fetch!(ctx, testid)
    manager = Map.fetch!(ctx, manager_key)

    {:ok, person} = Operately.People.update_person(person, %{manager_id: manager.id})

    Map.put(ctx, testid, person)
  end

  def suspend_company_member(ctx, key, _opts \\ []) do
    person = Map.fetch!(ctx, key)

    {:ok, person} =
      Operately.People.update_person(person, %{
        suspended: true,
        suspended_at: DateTime.utc_now()
      })

    Map.put(ctx, key, person)
  end

  def enable_feature(ctx, feature_name) do
    company = Map.fetch!(ctx, :company)
    {:ok, _} = Operately.Companies.enable_experimental_feature(company, feature_name)
    ctx
  end

  def disable_feature(ctx, feature_name) do
    company = Map.fetch!(ctx, :company)
    {:ok, _} = Operately.Companies.disable_experimental_feature(company, feature_name)
    ctx
  end
end
