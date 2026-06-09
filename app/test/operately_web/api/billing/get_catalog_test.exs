defmodule OperatelyWeb.Api.Billing.GetCatalogTest do
  use OperatelyWeb.TurboCase

  alias Operately.Billing
  alias Operately.Billing.PlanDefinition
  alias Operately.Repo

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:billing, :get_catalog], %{})
    end
  end

  describe "functionality" do
    setup :setup_account_ctx

    test "returns active customer-selectable plans and active products when billing is enabled", ctx do
      create_plan_definition(%{
        plan_key: "enterprise",
        display_name: "Enterprise",
        tier_rank: 8,
        billing_behavior: :provider_managed,
        customer_selectable: true,
        member_limit: 500,
        storage_limit_bytes: 5_497_558_138_880
      })

      create_plan_definition(%{
        plan_key: "internal_trial",
        display_name: "Internal Trial",
        tier_rank: 9,
        billing_behavior: :internal,
        customer_selectable: false,
        member_limit: 50,
        storage_limit_bytes: 1_024
      })

      {:ok, archived_plan} =
        Billing.create_plan_definition(%{
          plan_key: "legacy_enterprise",
          display_name: "Legacy Enterprise",
          tier_rank: 10,
          billing_behavior: :provider_managed,
          customer_selectable: true,
          member_limit: 800,
          storage_limit_bytes: 8_796_093_022_208
        })

      {:ok, _} = Billing.archive_plan_definition(archived_plan)

      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "enterprise",
          billing_interval: "monthly",
          polar_product_id: "prod_enterprise_monthly",
          polar_product_name: "Enterprise Monthly",
          price_amount: 19_900,
          price_currency: "usd",
          active: true
        })

      {:ok, _archived_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly",
          polar_product_name: "Business Yearly",
          price_amount: 199_000,
          price_currency: "usd",
          active: false,
          archived_at: DateTime.utc_now()
        })

      assert {200, res} = query(ctx.conn, [:billing, :get_catalog], %{})

      assert Enum.map(res.plans, & &1.key) == ["team", "business", "unlimited", "enterprise"]
      assert Enum.map(res.plans, & &1.tier_rank) == [1, 2, 3, 8]
      assert Enum.all?(res.plans, &(&1.customer_selectable == true))
      refute Enum.any?(res.plans, &(&1.key == "free"))
      refute Enum.any?(res.plans, &(&1.key == "internal_trial"))
      refute Enum.any?(res.plans, &(&1.key == "legacy_enterprise"))

      assert Enum.any?(res.catalog_products, &(&1.plan_family == "enterprise" and &1.billing_interval == "monthly"))
      refute Enum.any?(res.catalog_products, &(&1.polar_product_id == "prod_business_yearly"))
    end

    test "returns empty arrays when billing is disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      assert {200, %{plans: [], catalog_products: []}} = query(ctx.conn, [:billing, :get_catalog], %{})
    end
  end

  defp setup_account_ctx(ctx) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.log_in_account(:account)

    {:ok, ctx}
  end

  defp create_plan_definition(attrs) do
    %PlanDefinition{}
    |> PlanDefinition.changeset(attrs)
    |> Repo.insert!()
  end
end
