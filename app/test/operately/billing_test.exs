defmodule Operately.BillingTest do
  use Operately.DataCase

  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.ProductCatalogEntry
  alias Operately.Billing.Plans

  import Operately.CompaniesFixtures

  describe "billing_enabled?/0" do
    test "returns false by default" do
      refute Billing.billing_enabled?()
    end

    test "returns true when application env is set" do
      Application.put_env(:operately, :billing_enabled, true)
      assert Billing.billing_enabled?()
    after
      Application.delete_env(:operately, :billing_enabled)
    end
  end

  describe "billing_enabled_for_company?/1" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "returns false when instance billing is disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)
      refute Billing.billing_enabled_for_company?(ctx.company)
    end

    test "returns false when instance billing is enabled but company feature is off", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      refute Billing.billing_enabled_for_company?(ctx.company)
    end

    test "returns true when both instance and company feature are enabled", ctx do
      Application.put_env(:operately, :billing_enabled, true)
      {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "billing")
      assert Billing.billing_enabled_for_company?(company)
    after
      Application.delete_env(:operately, :billing_enabled)
    end
  end

  describe "billing accounts" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "get_or_create_billing_account/1 creates an account when none exists", ctx do
      assert nil == Billing.get_billing_account_by_company(ctx.company)

      assert {:ok, %CompanyBillingAccount{} = account} =
               Billing.get_or_create_billing_account(ctx.company)

      assert account.company_id == ctx.company.id
      assert account.status == :free
      assert account.provider == "polar"
    end

    test "get_or_create_billing_account/1 returns existing account", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      {:ok, same_account} = Billing.get_or_create_billing_account(ctx.company)

      assert account.id == same_account.id
    end

    test "sync_billing_account/2 creates an account when none exists", ctx do
      attrs = %{plan_key: "team", billing_interval: "monthly", status: :active}
      assert {:ok, account} = Billing.sync_billing_account(ctx.company, attrs)

      assert account.plan_key == "team"
      assert account.status == :active
    end

    test "sync_billing_account/2 updates an existing account", ctx do
      Billing.get_or_create_billing_account(ctx.company)

      attrs = %{plan_key: "business", billing_interval: "yearly", status: :active}
      assert {:ok, account} = Billing.sync_billing_account(ctx.company, attrs)

      assert account.plan_key == "business"
      assert account.billing_interval == "yearly"
    end

    test "remember_plan/4 stores suggested plan on account", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)

      assert {:ok, updated} = Billing.remember_plan(account, :team, "monthly", "website-pricing")
      assert updated.suggested_plan_key == "team"
      assert updated.suggested_billing_interval == :monthly
      assert updated.suggested_plan_source == "website-pricing"
    end

    test "set_pending_checkout/3 and clear_pending_checkout/1", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)

      assert {:ok, pending} = Billing.set_pending_checkout(account, :business, "yearly")
      assert pending.pending_plan_key == "business"
      assert pending.pending_billing_interval == :yearly
      assert pending.pending_checkout_started_at != nil

      assert {:ok, cleared} = Billing.clear_pending_checkout(pending)
      assert cleared.pending_plan_key == nil
      assert cleared.pending_billing_interval == nil
      assert cleared.pending_checkout_started_at == nil
    end
  end

  describe "product catalog" do
    test "create_product/1 with valid data" do
      attrs = %{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_123",
        polar_product_name: "Team Monthly",
        price_amount: 2900,
        price_currency: "USD"
      }

      assert {:ok, %ProductCatalogEntry{} = entry} = Billing.create_product(attrs)
      assert entry.plan_family == "team"
      assert entry.billing_interval == "monthly"
      assert entry.polar_product_id == "prod_123"
      assert entry.active == false
      assert entry.version == 1
    end

    test "create_product/1 with invalid plan_family returns error" do
      attrs = %{
        provider: "polar",
        plan_family: "enterprise",
        billing_interval: "monthly",
        polar_product_id: "prod_123"
      }

      assert {:error, %Ecto.Changeset{}} = Billing.create_product(attrs)
    end

    test "find_active_product/2 returns the active entry" do
      {:ok, entry} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_123"
        })

      assert nil == Billing.find_active_product("team", "monthly")

      {:ok, activated} = Billing.set_active_product(entry)
      assert activated.id == entry.id
      assert activated.active == true

      found = Billing.find_active_product("team", "monthly")
      assert found.id == entry.id
    end

    test "set_active_product/1 deactivates other entries for same plan_family and interval" do
      {:ok, old_entry} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_old"
        })

      {:ok, new_entry} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_new"
        })

      {:ok, _} = Billing.set_active_product(old_entry)
      assert Billing.find_active_product("team", "monthly").id == old_entry.id

      {:ok, _} = Billing.set_active_product(new_entry)
      assert Billing.find_active_product("team", "monthly").id == new_entry.id

      old = Billing.get_product!(old_entry.id)
      assert old.active == false
    end

    test "update_product/2 updates fields" do
      {:ok, entry} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_123"
        })

      assert {:ok, updated} = Billing.update_product(entry, %{price_amount: 4900})
      assert updated.price_amount == 4900
    end

    test "delete_product/1 removes entry" do
      {:ok, entry} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_123"
        })

      assert {:ok, _} = Billing.delete_product(entry)
      assert nil == Repo.get(ProductCatalogEntry, entry.id)
    end
  end

  describe "plans" do
    test "get/1 returns plan for atom key" do
      plan = Plans.get(:free)
      assert plan.display_name == "Free"
      assert plan.member_limit == 20
    end

    test "get/1 returns plan for string key" do
      plan = Plans.get("team")
      assert plan.display_name == "Team"
      assert plan.member_limit == 50
    end

    test "get/1 returns nil for unknown plan" do
      assert nil == Plans.get(:enterprise)
      assert nil == Plans.get("enterprise")
    end

    test "member_limit/1 returns limit for known plans" do
      assert Plans.member_limit(:free) == 20
      assert Plans.member_limit(:team) == 50
      assert Plans.member_limit(:business) == 200
      assert Plans.member_limit(:unknown) == nil
    end

    test "storage_limit_bytes/1 returns limit for known plans" do
      assert Plans.storage_limit_bytes(:free) == 1_073_741_824
      assert Plans.storage_limit_bytes(:team) == 107_374_182_400
      assert Plans.storage_limit_bytes(:business) == 1_099_511_627_776
      assert Plans.storage_limit_bytes(:unknown) == nil
    end

    test "valid_plan?/1 checks plan validity" do
      assert Plans.valid_plan?(:free)
      assert Plans.valid_plan?(:team)
      assert Plans.valid_plan?(:business)
      refute Plans.valid_plan?(:enterprise)
    end

    test "all/0 returns all plans" do
      plans = Plans.all()
      assert length(plans) == 3
      keys = Enum.map(plans, & &1.key)
      assert :free in keys
      assert :team in keys
      assert :business in keys
    end
  end
end
