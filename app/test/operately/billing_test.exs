defmodule Operately.BillingTest do
  use Operately.DataCase
  import Mock

  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.ProductCatalogEntry
  alias Operately.Billing.Plans
  alias Operately.Repo

  import Operately.CompaniesFixtures

  describe "billing_enabled?/0" do
    test "returns false by default" do
      Application.delete_env(:operately, :billing_enabled)
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

      assert {:ok, %CompanyBillingAccount{} = account} = Billing.get_or_create_billing_account(ctx.company)

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
      assert account.billing_interval == :yearly
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

    test "create_billing_account/1 accepts custom plan keys that exist in plan definitions", ctx do
      plan_definition = create_plan_definition(%{plan_key: "starter_internal", display_name: "Starter Internal", member_limit: 15})

      assert {:ok, account} =
               Billing.create_billing_account(%{
                 company_id: ctx.company.id,
                 provider: "polar",
                 plan_key: plan_definition.plan_key,
                 status: :free
               })

      assert account.plan_key == "starter_internal"
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
      assert entry.billing_interval == :monthly
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

    test "create_product/1 accepts custom provider-managed plan families" do
      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        billing_behavior: :provider_managed,
        customer_selectable: true
      })

      attrs = %{
        provider: "polar",
        plan_family: "enterprise",
        billing_interval: "monthly",
        polar_product_id: "prod_enterprise"
      }

      assert {:ok, %ProductCatalogEntry{} = entry} = Billing.create_product(attrs)
      assert entry.plan_family == "enterprise"
    end

    test "create_product/1 rejects internal plan families" do
      create_plan_definition(%{
        plan_key: "internal_support",
        display_name: "Internal Support",
        billing_behavior: :internal
      })

      attrs = %{
        provider: "polar",
        plan_family: "internal_support",
        billing_interval: "monthly",
        polar_product_id: "prod_internal_support"
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

    test "next_product_version/2 increments within a plan family and interval" do
      {:ok, _} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly_v1",
          version: 1
        })

      {:ok, _} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly_v2",
          version: 2
        })

      {:ok, _} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "yearly",
          polar_product_id: "prod_pro_yearly_v1",
          version: 1
        })

      assert Billing.next_product_version("team", "monthly") == 3
      assert Billing.next_product_version("team", "yearly") == 2
      assert Billing.next_product_version("business", "monthly") == 1
    end

    test "set_active_product/1 rejects archived products" do
      {:ok, product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_archived",
          archived_at: DateTime.utc_now()
        })

      assert {:error, :archived} = Billing.set_active_product(product)
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

    test "managed product sync imports only Operately-managed products, paginates, preserves local active mappings, and deactivates archived products" do
      {:ok, active_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly",
          polar_product_name: "Team Monthly",
          price_amount: 1900,
          price_currency: "usd",
          version: 1,
          active: true
        })

      {:ok, archived_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly",
          polar_product_name: "Business Yearly",
          price_amount: 99000,
          price_currency: "usd",
          version: 1,
          active: true
        })

      with_mock Operately.Billing.Polar.Client,
        list_products: fn
          [cursor: nil] ->
            {:ok,
             %{
               items: [
                 managed_product_payload(%{
                   "id" => "prod_pro_monthly",
                   "name" => "Team Monthly Updated",
                   "price_amount" => 2900,
                   "metadata" => managed_metadata("team", "monthly", 1)
                 }),
                 unmanaged_product_payload(),
                 managed_product_payload(%{
                   "id" => "prod_pro_yearly",
                   "name" => "Team Yearly",
                   "recurring_interval" => "yearly",
                   "price_amount" => 29900,
                   "metadata" => managed_metadata("team", "yearly", 1)
                 })
               ],
               next_cursor: "page-2"
             }}

          [cursor: "page-2"] ->
            {:ok,
             %{
               items: [
                 managed_product_payload(%{
                   "id" => "prod_business_yearly",
                   "name" => "Business Yearly Archived",
                   "recurring_interval" => "yearly",
                   "price_amount" => 109_000,
                   "is_archived" => true,
                   "metadata" => managed_metadata("business", "yearly", 2)
                 })
               ],
               next_cursor: nil
             }}
        end do
        assert {:ok, 3} = Operately.Billing.Polar.Operations.ProductSync.run()
      end

      synced_active = Billing.get_product!(active_product.id)
      assert synced_active.active == true
      assert synced_active.polar_product_name == "Team Monthly Updated"
      assert synced_active.price_amount == 2900

      imported = Billing.get_product_by_polar_product_id("prod_pro_yearly")
      assert imported.plan_family == "team"
      assert imported.billing_interval == :yearly
      assert imported.active == false
      assert imported.version == 1

      synced_archived = Billing.get_product!(archived_product.id)
      assert synced_archived.active == false
      assert synced_archived.archived_at
      assert synced_archived.version == 2
    end
  end

  describe "customer state sync" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "404 from Polar normalizes to the free plan", ctx do
      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end do
        assert {:ok, account} = Billing.refresh_company_billing_state(ctx.company)

        assert account.status == :free
        assert account.plan_key == nil
        assert account.billing_interval == nil
        assert account.cancel_at_period_end == false
        assert account.current_period_end == nil
        assert account.last_synced_at
      end
    end

    test "active subscription is normalized from the matching local catalog product", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_pro_monthly",
          active: true
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_pro_monthly",
                 "current_period_end" => "2026-06-30T00:00:00Z",
                 "cancel_at_period_end" => false
               }
             ]
           }}
        end do
        assert {:ok, account} = Billing.refresh_company_billing_state(ctx.company)

        assert account.status == :active
        assert account.plan_key == "team"
        assert account.billing_interval == :monthly
        assert account.current_period_end == ~U[2026-06-30 00:00:00Z]
        assert account.cancel_at_period_end == false
      end
    end

    test "cancel-at-period-end subscriptions preserve paid state and the cancellation flag", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly"
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_business_yearly",
                 "current_period_end" => "2026-12-31T00:00:00Z",
                 "cancel_at_period_end" => true
               }
             ]
           }}
        end do
        assert {:ok, account} = Billing.refresh_company_billing_state(ctx.company)

        assert account.status == :active
        assert account.plan_key == "business"
        assert account.billing_interval == :yearly
        assert account.cancel_at_period_end == true
      end
    end

    test "unknown provider products keep the paid status but clear the local plan mapping", ctx do
      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id ->
          {:ok,
           %{
             "subscriptions" => [
               %{
                 "status" => "active",
                 "product_id" => "prod_unknown",
                 "current_period_end" => "2026-06-30T00:00:00Z",
                 "cancel_at_period_end" => false
               }
             ]
           }}
        end do
        assert {:ok, account} = Billing.refresh_company_billing_state(ctx.company)

        assert account.status == :active
        assert account.plan_key == nil
        assert account.billing_interval == nil
      end
    end

    test "billing overview falls back to the local projection when Polar is unavailable", ctx do
      {:ok, account} =
        Billing.sync_billing_account(ctx.company, %{
          provider: "polar",
          plan_key: :team,
          billing_interval: :monthly,
          status: :active
        })

      with_mock Operately.Billing.Polar.Client,
        get_customer_state_by_external_id: fn _company_id -> {:error, :internal_server_error} end do
        assert {:ok, overview} = Billing.get_company_billing_overview(ctx.company)

        assert overview.stale == true
        assert overview.account.id == account.id
        assert overview.account.status == :active
      end
    end
  end

  describe "hosted sessions" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "create_payment_method_session/2 builds a default return URL and hosted session", ctx do
      {:ok, _product} = create_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly")}
        end,
        create_customer_session: fn external_customer_id, return_url ->
          assert external_customer_id == ctx.company.id
          assert return_url == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_admin_path(ctx.company)

          {:ok,
           %{
             "customer_portal_url" => "https://polar.sh/example/portal/session-1",
             "return_url" => return_url,
             "expires_at" => "2026-06-30T00:00:00Z"
           }}
        end do
        assert {:ok, session} = Billing.create_payment_method_session(ctx.company)

        assert session.provider == "polar"
        assert session.url == "https://polar.sh/example/portal/session-1"
        assert session.return_url == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_admin_path(ctx.company)
        assert session.expires_at == ~U[2026-06-30 00:00:00Z]
      end
    end

    test "create_customer_portal_session/2 accepts a custom relative return path", ctx do
      {:ok, _product} = create_product("prod_business_yearly", "business", "yearly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_business_yearly")}
        end,
        create_customer_session: fn external_customer_id, return_url ->
          assert external_customer_id == ctx.company.id
          assert return_url == Operately.Billing.Polar.Client.app_base_url() <> "/custom/path?from=billing"

          {:ok,
           %{
             "customer_portal_url" => "https://polar.sh/example/portal/session-2",
             "expires_at" => "2026-07-31T00:00:00Z"
           }}
        end do
        assert {:ok, session} = Billing.create_customer_portal_session(ctx.company, return_to: "/custom/path?from=billing")

        assert session.url == "https://polar.sh/example/portal/session-2"
        assert session.return_url == Operately.Billing.Polar.Client.app_base_url() <> "/custom/path?from=billing"
      end
    end

    test "hosted session creation rejects invalid return paths", ctx do
      assert {:error, :bad_request} = Billing.create_customer_portal_session(ctx.company, return_to: "https://example.com")
      assert {:error, :bad_request} = Billing.create_customer_portal_session(ctx.company, return_to: "//example.com")
      assert {:error, :bad_request} = Billing.create_customer_portal_session(ctx.company, return_to: "billing")
    end

    test "hosted session creation returns not found for free companies", ctx do
      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_customer_session: fn _external_customer_id, _return_url -> flunk("unexpected customer session call") end do
        assert {:error, :not_found} = Billing.create_payment_method_session(ctx.company)
      end
    end

    test "hosted session creation returns provider failures from the strict refresh", ctx do
      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :internal_server_error} end,
        create_customer_session: fn _external_customer_id, _return_url -> flunk("unexpected customer session call") end do
        assert {:error, :internal_server_error} = Billing.create_payment_method_session(ctx.company)
      end
    end
  end

  describe "checkout sessions" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "create_checkout_session/4 creates checkout for a free company and persists pending state", ctx do
      {:ok, _product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_checkout_session: fn attrs ->
          assert attrs[:products] == ["prod_pro_monthly"]
          assert attrs[:external_customer_id] == ctx.company.id
          assert attrs[:return_url] == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_billing_path(ctx.company)
          assert attrs[:success_url] == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_billing_path(ctx.company) <> "?checkout_id={CHECKOUT_ID}"

          {:ok,
           checkout_session_payload(%{
             "id" => "chk_free",
             "return_url" => attrs[:return_url],
             "success_url" => attrs[:success_url]
           })}
        end do
        assert {:ok, session} = Billing.create_checkout_session(ctx.company, :team, :monthly)

        assert session.provider == "polar"
        assert session.id == "chk_free"
        assert session.url == "https://polar.sh/example/checkout"
        assert session.return_url == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_billing_path(ctx.company)
        assert session.success_url == Operately.Billing.Polar.Client.app_base_url() <> OperatelyWeb.Paths.company_billing_path(ctx.company) <> "?checkout_id={CHECKOUT_ID}"
        assert session.expires_at == ~U[2026-08-31 00:00:00Z]

        account = Billing.get_billing_account_by_company(ctx.company)
        assert account.status == :free
        assert account.pending_plan_key == "team"
        assert account.pending_billing_interval == :monthly
        assert account.pending_checkout_started_at != nil
      end
    end

    test "create_checkout_session/4 allows a canceled company to start a new checkout", ctx do
      {:ok, _old_product} = create_active_product("prod_old_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_old_pro_monthly", %{"status" => "canceled"})}
        end,
        create_checkout_session: fn _attrs ->
          {:ok, checkout_session_payload(%{"id" => "chk_canceled"})}
        end do
        assert {:ok, session} = Billing.create_checkout_session(ctx.company, :business, :yearly)

        assert session.id == "chk_canceled"

        account = Billing.get_billing_account_by_company(ctx.company)
        assert account.status == :canceled
        assert account.pending_plan_key == "business"
        assert account.pending_billing_interval == :yearly
      end
    end

    test "create_checkout_session/4 rejects active paid companies", ctx do
      {:ok, _current_product} = create_active_product("prod_current_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_current_pro_monthly")}
        end,
        create_checkout_session: fn _attrs -> flunk("unexpected checkout session call") end do
        assert {:error, :bad_request} = Billing.create_checkout_session(ctx.company, :business, :yearly)
      end
    end

    test "create_checkout_session/4 rejects past-due paid companies", ctx do
      {:ok, _current_product} = create_active_product("prod_current_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_current_pro_monthly", %{"status" => "past_due"})}
        end,
        create_checkout_session: fn _attrs -> flunk("unexpected checkout session call") end do
        assert {:error, :bad_request} = Billing.create_checkout_session(ctx.company, :business, :yearly)
      end
    end

    test "create_checkout_session/4 rejects invalid plan and billing interval values", ctx do
      assert {:error, :bad_request} = Billing.create_checkout_session(ctx.company, :free, :monthly)
      assert {:error, :bad_request} = Billing.create_checkout_session(ctx.company, :team, "weekly")
    end

    test "create_checkout_session/4 returns not found when the requested target is not sellable", ctx do
      assert {:error, :not_found} = Billing.create_checkout_session(ctx.company, :team, :monthly)
    end

    test "create_checkout_session/4 does not persist pending state when Polar checkout creation fails", ctx do
      {:ok, _product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        create_checkout_session: fn _attrs -> {:error, :internal_server_error} end do
        assert {:error, :internal_server_error} = Billing.create_checkout_session(ctx.company, :team, :monthly)

        account = Billing.get_billing_account_by_company(ctx.company)
        assert account.status == :free
        assert account.pending_plan_key == nil
        assert account.pending_billing_interval == nil
        assert account.pending_checkout_started_at == nil
      end
    end

    test "live sync clears pending checkout when the company reaches the pending target", ctx do
      {:ok, _product} = create_active_product("prod_business_yearly", "business", "yearly")
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      {:ok, _pending_account} = Billing.set_pending_checkout(account, :business, :yearly)

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_business_yearly")}
        end do
        assert {:ok, refreshed} = Billing.refresh_company_billing_state(ctx.company)

        assert refreshed.status == :active
        assert refreshed.plan_key == "business"
        assert refreshed.billing_interval == :yearly
        assert refreshed.pending_plan_key == nil
        assert refreshed.pending_billing_interval == nil
        assert refreshed.pending_checkout_started_at == nil
      end
    end

    test "live sync preserves pending checkout when the purchase is still not completed", ctx do
      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      {:ok, _pending_account} = Billing.set_pending_checkout(account, :business, :yearly)

      with_mock Operately.Billing.Polar.Client, [:passthrough], get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end do
        assert {:ok, refreshed} = Billing.refresh_company_billing_state(ctx.company)

        assert refreshed.status == :free
        assert refreshed.pending_plan_key == "business"
        assert refreshed.pending_billing_interval == :yearly
        assert refreshed.pending_checkout_started_at != nil
      end
    end
  end

  describe "subscription mutations" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "change_plan/4 upgrades an active subscription immediately", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_yearly", "business", "yearly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_upgrade"})},
        {:ok, active_subscription_payload("prod_business_yearly", %{"id" => "sub_upgrade"})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn subscription_id, attrs ->
          assert subscription_id == "sub_upgrade"
          assert attrs == %{product_id: "prod_business_yearly", proration_behavior: "prorate"}
          {:ok, %{"id" => subscription_id}}
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :business, :yearly)

        assert overview.account.plan_key == "business"
        assert overview.account.billing_interval == :yearly
        assert overview.account.scheduled_plan_key == nil
      end
    end

    test "change_plan/4 upgrades a past-due subscription immediately", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_past_due", "status" => "past_due"})},
        {:ok, active_subscription_payload("prod_business_monthly", %{"id" => "sub_past_due", "status" => "past_due"})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_past_due", %{product_id: "prod_business_monthly", proration_behavior: "prorate"} ->
          {:ok, %{"id" => "sub_past_due"}}
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :business, :monthly)
        assert overview.account.plan_key == "business"
        assert overview.account.billing_interval == :monthly
        assert overview.account.status == :past_due
      end
    end

    test "change_plan/4 schedules downgrades and persists scheduled target fields", ctx do
      {:ok, _current_product} = create_active_product("prod_business_yearly", "business", "yearly")
      {:ok, _target_product} = create_active_product("prod_pro_yearly", "team", "yearly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_business_yearly", %{"id" => "sub_downgrade"})},
        {:ok,
         active_subscription_payload("prod_business_yearly", %{
           "id" => "sub_downgrade",
           "pending_update" => %{"product_id" => "prod_pro_yearly"}
         })}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_downgrade", %{product_id: "prod_pro_yearly", proration_behavior: "next_period"} ->
          {:ok, %{"id" => "sub_downgrade"}}
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :team, :yearly)

        assert overview.account.plan_key == "business"
        assert overview.account.billing_interval == :yearly
        assert overview.account.scheduled_plan_key == "team"
        assert overview.account.scheduled_billing_interval == :yearly
        assert overview.account.scheduled_change_effective_at == ~U[2026-06-30 00:00:00Z]
      end
    end

    test "change_plan/4 applies monthly-to-yearly interval switches immediately", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_pro_yearly", "team", "yearly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_interval"})},
        {:ok, active_subscription_payload("prod_pro_yearly", %{"id" => "sub_interval"})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_interval", %{product_id: "prod_pro_yearly", proration_behavior: "prorate"} ->
          {:ok, %{"id" => "sub_interval"}}
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :team, :yearly)

        assert overview.account.plan_key == "team"
        assert overview.account.billing_interval == :yearly
        assert overview.account.scheduled_plan_key == nil
      end
    end

    test "change_plan/4 schedules yearly-to-monthly interval switches", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_yearly", "team", "yearly")
      {:ok, _target_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_yearly", %{"id" => "sub_interval"})},
        {:ok,
         active_subscription_payload("prod_pro_yearly", %{
           "id" => "sub_interval",
           "pending_update" => %{"product_id" => "prod_pro_monthly"}
         })}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_interval", %{product_id: "prod_pro_monthly", proration_behavior: "next_period"} ->
          {:ok, %{"id" => "sub_interval"}}
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :team, :monthly)

        assert overview.account.plan_key == "team"
        assert overview.account.billing_interval == :yearly
        assert overview.account.scheduled_plan_key == "team"
        assert overview.account.scheduled_billing_interval == :monthly
      end
    end

    test "change_plan/4 rejects free and ended companies", ctx do
      {:ok, _target_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> {:error, :not_found} end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:error, :not_found} = Billing.change_plan(ctx.company, :team, :monthly)
      end

      {:ok, _current_product} = create_active_product("prod_business_monthly", "business", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_business_monthly", %{"id" => "sub_canceled", "status" => "canceled"})}
        end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:error, :not_found} = Billing.change_plan(ctx.company, :team, :monthly)
      end
    end

    test "change_plan/4 rejects raw trialing subscriptions", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_trialing", "status" => "trialing"})}
        end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:error, :bad_request} = Billing.change_plan(ctx.company, :business, :monthly)
      end
    end

    test "change_plan/4 rejects no-op plan changes", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_noop"})}
        end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:error, :bad_request} = Billing.change_plan(ctx.company, :team, :monthly)
      end
    end

    test "change_plan/4 reactivates a pending cancellation before applying the new target", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_reactivate_first", "cancel_at_period_end" => true})},
        {:ok, active_subscription_payload("prod_business_monthly", %{"id" => "sub_reactivate_first"})}
      ])

      put_sequence(:subscription_update_responses, [
        {:ok, %{"id" => "sub_reactivate_first"}},
        {:ok, %{"id" => "sub_reactivate_first"}}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn subscription_id, attrs ->
          record_call(:subscription_update_calls, {subscription_id, attrs})
          next_sequence(:subscription_update_responses)
        end do
        assert {:ok, overview} = Billing.change_plan(ctx.company, :business, :monthly)

        assert overview.account.plan_key == "business"

        assert recorded_calls(:subscription_update_calls) == [
                 {"sub_reactivate_first", %{cancel_at_period_end: false}},
                 {"sub_reactivate_first", %{product_id: "prod_business_monthly", proration_behavior: "prorate"}}
               ]
      end
    end

    test "change_plan/4 attempts to restore cancellation if the target update fails after reactivation", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")
      {:ok, _target_product} = create_active_product("prod_business_monthly", "business", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_restore", "cancel_at_period_end" => true})}
      ])

      put_sequence(:subscription_update_responses, [
        {:ok, %{"id" => "sub_restore"}},
        {:error, :internal_server_error},
        {:ok, %{"id" => "sub_restore"}}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn subscription_id, attrs ->
          record_call(:subscription_update_calls, {subscription_id, attrs})
          next_sequence(:subscription_update_responses)
        end do
        assert {:error, :internal_server_error} = Billing.change_plan(ctx.company, :business, :monthly)

        assert recorded_calls(:subscription_update_calls) == [
                 {"sub_restore", %{cancel_at_period_end: false}},
                 {"sub_restore", %{product_id: "prod_business_monthly", proration_behavior: "prorate"}},
                 {"sub_restore", %{cancel_at_period_end: true}}
               ]
      end
    end

    test "cancel_subscription/2 schedules period-end cancellation", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel"})},
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel", "cancel_at_period_end" => true})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_cancel", %{cancel_at_period_end: true} ->
          {:ok, %{"id" => "sub_cancel"}}
        end do
        assert {:ok, overview} = Billing.cancel_subscription(ctx.company)
        assert overview.account.cancel_at_period_end == true
      end
    end

    test "cancel_subscription/2 is idempotent when cancellation is already pending", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel_pending", "cancel_at_period_end" => true})},
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_cancel_pending", "cancel_at_period_end" => true})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:ok, overview} = Billing.cancel_subscription(ctx.company)
        assert overview.account.cancel_at_period_end == true
      end
    end

    test "reactivate_subscription/2 clears pending cancellation", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_reactivate", "cancel_at_period_end" => true})},
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_reactivate", "cancel_at_period_end" => false})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn "sub_reactivate", %{cancel_at_period_end: false} ->
          {:ok, %{"id" => "sub_reactivate"}}
        end do
        assert {:ok, overview} = Billing.reactivate_subscription(ctx.company)
        assert overview.account.cancel_at_period_end == false
      end
    end

    test "reactivate_subscription/2 is idempotent when cancellation is not pending", ctx do
      {:ok, _current_product} = create_active_product("prod_pro_monthly", "team", "monthly")

      put_sequence(:customer_state_responses, [
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_still_active"})},
        {:ok, active_subscription_payload("prod_pro_monthly", %{"id" => "sub_still_active"})}
      ])

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id -> next_sequence(:customer_state_responses) end,
        update_subscription: fn _subscription_id, _attrs -> flunk("unexpected update call") end do
        assert {:ok, overview} = Billing.reactivate_subscription(ctx.company)
        assert overview.account.cancel_at_period_end == false
      end
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
      assert Plans.member_limit(:unlimited) == nil
      assert Plans.member_limit(:unknown) == nil
    end

    test "storage_limit_bytes/1 returns limit for known plans" do
      assert Plans.storage_limit_bytes(:free) == 1_073_741_824
      assert Plans.storage_limit_bytes(:team) == 107_374_182_400
      assert Plans.storage_limit_bytes(:business) == 1_099_511_627_776
      assert Plans.storage_limit_bytes(:unlimited) == nil
      assert Plans.storage_limit_bytes(:unknown) == nil
    end

    test "valid_plan?/1 checks plan validity" do
      assert Plans.valid_plan?(:free)
      assert Plans.valid_plan?(:team)
      assert Plans.valid_plan?(:business)
      assert Plans.valid_plan?(:unlimited)
      refute Plans.valid_plan?(:enterprise)
    end

    test "all/0 returns all plans" do
      plans = Plans.all()
      assert length(plans) == 4

      keys = Enum.map(plans, & &1.plan_key)

      assert "free" in keys
      assert "team" in keys
      assert "business" in keys
      assert "unlimited" in keys
    end

    test "dynamic plan helpers use plan-definition metadata" do
      create_plan_definition(%{
        plan_key: "legacy_enterprise",
        display_name: "Legacy Enterprise",
        tier_rank: 8,
        billing_behavior: :provider_managed,
        customer_selectable: false,
        archived_at: DateTime.utc_now()
      })

      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        tier_rank: 4,
        billing_behavior: :provider_managed,
        customer_selectable: true,
        member_limit: 500,
        storage_limit_bytes: 5_497_558_138_880
      })

      {:ok, _team_product} = Billing.create_product(%{provider: "polar", plan_family: "team", billing_interval: "monthly", polar_product_id: "prod_team", active: true})
      {:ok, _enterprise_product} = Billing.create_product(%{provider: "polar", plan_family: "enterprise", billing_interval: "monthly", polar_product_id: "prod_enterprise", active: true})
      {:ok, _business_product} = Billing.create_product(%{provider: "polar", plan_family: "business", billing_interval: "monthly", polar_product_id: "prod_business", active: true})

      assert Plans.valid_plan?("enterprise")
      assert Plans.active_plan?("enterprise")
      assert Plans.provider_managed_plan?("enterprise")
      refute Plans.customer_selectable_plan?("legacy_enterprise")
      refute Plans.active_plan?("legacy_enterprise")
      assert Plans.compare_rank("enterprise", "business") > 0
      assert Plans.next_self_serve_upgrade_plan_keys("team") == ["business", "enterprise"]
    end

    test "current-plan resolution keeps nil mapped to free" do
      assert Plans.resolve_current_plan_key(nil) == "free"
      assert Plans.resolve_current_plan_key(:team) == "team"
    end
  end

  describe "dynamic billing runtime" do
    test "limit enforcement uses custom plan definitions and dynamic sellable upgrades" do
      Application.put_env(:operately, :billing_enabled, true)

      company = company_fixture()
      {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
      free_company = company_fixture()
      {:ok, free_company} = Operately.Companies.enable_experimental_feature(free_company, "billing")

      create_plan_definition(%{
        plan_key: "starter_internal",
        display_name: "Starter Internal",
        tier_rank: 9,
        billing_behavior: :internal,
        member_limit: 9,
        storage_limit_bytes: 2_048
      })

      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        tier_rank: 4,
        billing_behavior: :provider_managed,
        customer_selectable: true,
        member_limit: 500,
        storage_limit_bytes: 5_497_558_138_880
      })

      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "enterprise",
          billing_interval: "monthly",
          polar_product_id: "prod_enterprise_monthly",
          active: true
        })

      {:ok, _account} =
        Billing.create_billing_account(%{
          company_id: company.id,
          provider: "polar",
          plan_key: "starter_internal",
          status: :active
        })

      status = EnforceLimits.status(company, :member_count, current_usage: 9)

      assert status.plan_key == "starter_internal"
      assert status.limit == 9
      refute status.blocked

      free_status = EnforceLimits.status(free_company, :member_count, current_usage: 19)

      assert free_status.plan_key == "free"
      assert free_status.recommended_upgrade.plan_key == "enterprise"
      assert free_status.recommended_upgrade.billing_interval == :monthly
    after
      Application.delete_env(:operately, :billing_enabled)
    end
  end

  describe "plan definitions" do
    test "list_plan_definitions/0 returns the seeded rows in order" do
      plan_definitions = Billing.list_plan_definitions()

      assert Enum.map(plan_definitions, & &1.plan_key) == ["free", "team", "business", "unlimited"]
      assert Enum.map(plan_definitions, & &1.display_name) == ["Free", "Team", "Business", "Unlimited"]

      assert Enum.map(plan_definitions, &{&1.plan_key, &1.tier_rank, &1.billing_behavior, &1.customer_selectable}) == [
               {"free", 0, :internal, false},
               {"team", 1, :provider_managed, true},
               {"business", 2, :provider_managed, true},
               {"unlimited", 3, :provider_managed, true}
             ]
    end

    test "update_plan_definition/2 updates editable fields and supports unlimited values" do
      team_plan =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "team"))

      assert {:ok, updated} =
               Billing.update_plan_definition(team_plan, %{
                 display_name: "Team Plus",
                 tier_rank: 5,
                 member_limit: nil,
                 storage_limit_bytes: 500_000
               })

      assert updated.display_name == "Team Plus"
      assert updated.tier_rank == 5
      assert updated.member_limit == nil
      assert updated.storage_limit_bytes == 500_000
    end
  end

  defp managed_metadata(plan_family, billing_interval, version) do
    %{
      "operately_managed" => "true",
      "operately_plan_family" => plan_family,
      "operately_billing_interval" => billing_interval,
      "operately_version" => version
    }
  end

  defp managed_product_payload(overrides) do
    base = %{
      "id" => "prod_test",
      "name" => "Managed Product",
      "recurring_interval" => "monthly",
      "prices" => [%{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "usd"}],
      "metadata" => managed_metadata("team", "monthly", 1),
      "is_archived" => false
    }

    base
    |> Map.merge(overrides)
    |> maybe_override_price(overrides)
  end

  defp unmanaged_product_payload do
    %{
      "id" => "prod_manual",
      "name" => "Manual Product",
      "recurring_interval" => "monthly",
      "prices" => [%{"amount_type" => "fixed", "price_amount" => 1900, "price_currency" => "usd"}],
      "metadata" => %{},
      "is_archived" => false
    }
  end

  defp maybe_override_price(product, overrides) do
    case Map.fetch(overrides, "price_amount") do
      {:ok, amount} ->
        Map.put(product, "prices", [%{"amount_type" => "fixed", "price_amount" => amount, "price_currency" => "usd"}])

      :error ->
        product
    end
  end

  defp create_product(polar_product_id, plan_family, billing_interval) do
    Billing.create_product(%{
      provider: "polar",
      plan_family: plan_family,
      billing_interval: billing_interval,
      polar_product_id: polar_product_id
    })
  end

  defp create_active_product(polar_product_id, plan_family, billing_interval) do
    with {:ok, product} <- create_product(polar_product_id, plan_family, billing_interval),
         {:ok, product} <- Billing.set_active_product(product) do
      {:ok, product}
    end
  end

  defp create_plan_definition(attrs) do
    unique = System.unique_integer([:positive])

    attrs =
      Enum.into(attrs, %{
        plan_key: "plan_#{unique}",
        display_name: "Plan #{unique}",
        tier_rank: 100 + unique,
        billing_behavior: :internal,
        customer_selectable: false,
        member_limit: 10,
        storage_limit_bytes: 1_024
      })

    %PlanDefinition{}
    |> PlanDefinition.changeset(attrs)
    |> Repo.insert!()
  end

  defp active_subscription_payload(product_id, overrides \\ %{}) do
    subscription =
      %{
        "id" => "sub_test",
        "status" => "active",
        "product_id" => product_id,
        "current_period_end" => "2026-06-30T00:00:00Z",
        "cancel_at_period_end" => false
      }
      |> Map.merge(overrides)

    %{"subscriptions" => [subscription]}
  end

  defp put_sequence(key, values) do
    Process.put(key, values)
  end

  defp next_sequence(key) do
    case Process.get(key, []) do
      [value | rest] ->
        Process.put(key, rest)
        value

      [] ->
        flunk("No queued sequence value for #{inspect(key)}")
    end
  end

  defp record_call(key, value) do
    Process.put(key, [value | Process.get(key, [])])
  end

  defp recorded_calls(key) do
    key
    |> Process.get([])
    |> Enum.reverse()
  end

  defp checkout_session_payload(overrides) do
    %{
      "id" => "chk_test",
      "url" => "https://polar.sh/example/checkout",
      "return_url" => "https://app.operately.test/company/admin/billing",
      "success_url" => "https://app.operately.test/company/admin/billing?checkout_id={CHECKOUT_ID}",
      "expires_at" => "2026-08-31T00:00:00Z"
    }
    |> Map.merge(overrides)
  end
end
