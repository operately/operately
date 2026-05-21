defmodule OperatelyWeb.Api.Companies.CreateTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.Repo

  @input %{
    company_name: "Acme Co.",
    title: "Founder"
  }

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :create_member], %{})
    end
  end

  describe "add_company functionality" do
    test "creates company and an associated person record", ctx do
      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = mutation(conn, [:companies, :create], @input)
      assert res.company.name == "Acme Co."

      company = Operately.Companies.get_company_by_name("Acme Co.")
      people = Ecto.assoc(company, :people) |> Repo.all()

      assert length(people) == 1

      person = hd(people)
      assert person.full_name == account.full_name
      assert person.title == "Founder"
      assert person.account_id == account.id
      assert person.company_id == company.id

      reloaded_account = Operately.People.get_account_by_email(account.email)
      refute reloaded_account.site_admin

      owners = Operately.Companies.list_owners(company)
      assert Enum.any?(owners, fn o -> o.id == person.id end)
    end

    test "uses avatar from existing person when creating a new company", ctx do
      account = Operately.PeopleFixtures.account_fixture()

      # Create an existing company with a person that has an avatar
      existing_company = Operately.CompaniesFixtures.company_fixture()

      Operately.PeopleFixtures.person_fixture(%{
        account_id: account.id,
        company_id: existing_company.id,
        avatar_url: "https://example.com/avatar.jpg"
      })

      conn = log_in_account(ctx.conn, account)

      # Create a new company with the same account
      assert {200, res} = mutation(conn, [:companies, :create], @input)
      assert res.company.name == "Acme Co."

      company = Operately.Companies.get_company_by_name("Acme Co.")
      people = Ecto.assoc(company, :people) |> Repo.all()

      assert length(people) == 1

      person = hd(people)
      assert person.avatar_url == "https://example.com/avatar.jpg"
    end

    test "remembers paid billing intent when billing is enabled", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "team", billing_period: "monthly"}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      billing_account = Billing.get_billing_account_by_company(company)

      assert billing_account.suggested_plan_key == "team"
      assert billing_account.suggested_billing_interval == :monthly
      assert billing_account.suggested_plan_source == "website"
      assert billing_account.status == :free
      assert billing_account.plan_key == nil
    end

    test "does not remember billing intent for demo companies", ctx do
      previous_demo_builder_allowed = Application.get_env(:operately, :demo_builder_allowed)

      Application.put_env(:operately, :billing_enabled, true)
      Application.put_env(:operately, :demo_builder_allowed, true)

      on_exit(fn ->
        Application.delete_env(:operately, :billing_enabled)

        if previous_demo_builder_allowed == nil do
          Application.delete_env(:operately, :demo_builder_allowed)
        else
          Application.put_env(:operately, :demo_builder_allowed, previous_demo_builder_allowed)
        end
      end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "team", billing_period: "monthly", is_demo: true}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      assert Billing.get_billing_account_by_company(company) == nil
    end

    test "does not remember billing intent when billing is disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "team", billing_period: "monthly"}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      assert Billing.get_billing_account_by_company(company) == nil
    end

    test "ignores invalid billing plan params", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "enterprise", billing_period: "monthly"}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      assert Billing.get_billing_account_by_company(company) == nil
    end

    test "ignores invalid billing period params", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "team", billing_period: "weekly"}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      assert Billing.get_billing_account_by_company(company) == nil
    end

    test "ignores free billing plan params", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      account = Operately.PeopleFixtures.account_fixture()
      conn = log_in_account(ctx.conn, account)

      assert {200, _res} =
               mutation(conn, [:companies, :create], Map.merge(@input, %{plan: "free", billing_period: "monthly"}))

      company = Operately.Companies.get_company_by_name("Acme Co.")
      assert Billing.get_billing_account_by_company(company) == nil
    end
  end
end
