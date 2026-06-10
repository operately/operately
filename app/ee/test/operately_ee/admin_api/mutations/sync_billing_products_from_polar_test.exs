defmodule OperatelyEE.AdminApi.Mutations.SyncBillingProductsFromPolarTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing
  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :sync_billing_products_from_polar, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :sync_billing_products_from_polar, %{})
    end
  end

  describe "functionality" do
    setup ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.put_env(:operately, :billing_enabled, false) end)

      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "synchronizes managed Polar products and returns the imported count", ctx do
      with_mock Operately.Billing.Polar.Client,
        list_products: fn
          [cursor: nil] ->
            {:ok,
             %{
               items: [
                 %{
                   "id" => "prod_team_monthly",
                   "name" => "Team Monthly",
                   "recurring_interval" => "monthly",
                   "prices" => [%{"amount_type" => "fixed", "price_amount" => 2900, "price_currency" => "usd"}],
                   "metadata" => %{
                     "operately_managed" => "true",
                     "operately_plan_family" => "team",
                     "operately_billing_interval" => "monthly",
                     "operately_version" => 1
                   },
                   "is_archived" => false
                 },
                 %{
                   "id" => "prod_manual",
                   "name" => "Manual Product",
                   "recurring_interval" => "monthly",
                   "prices" => [%{"amount_type" => "fixed", "price_amount" => 1900, "price_currency" => "usd"}],
                   "metadata" => %{},
                   "is_archived" => false
                 }
               ],
               next_cursor: nil
             }}
        end do
        assert {200, %{success: true, synced_count: 1}} = admin_mutation(ctx.conn, :sync_billing_products_from_polar, %{})
      end

      product = Operately.Billing.get_product_by_polar_product_id("prod_team_monthly")
      assert product.plan_family == "team"
      assert product.billing_interval == :monthly
      assert product.price_amount == 2900
    end

    test "creates a missing provider-managed plan definition before syncing the product and keeps the response contract unchanged", ctx do
      metadata =
        ProductMapper.metadata(
          %PlanDefinition{
            plan_key: "enterprise",
            display_name: "Enterprise",
            tier_rank: 8,
            billing_behavior: :provider_managed,
            customer_selectable: true,
            member_limit: 500,
            storage_limit_bytes: 5_497_558_138_880
          },
          :monthly,
          1
        )

      with_mock Operately.Billing.Polar.Client,
        list_products: fn
          [cursor: nil] ->
            {:ok,
             %{
               items: [
                 %{
                   "id" => "prod_enterprise_monthly",
                   "name" => "Enterprise Monthly",
                   "recurring_interval" => "monthly",
                   "prices" => [%{"amount_type" => "fixed", "price_amount" => 19_900, "price_currency" => "usd"}],
                   "metadata" => metadata,
                   "is_archived" => false
                 }
               ],
               next_cursor: nil
             }}
        end do
        assert {200, %{success: true, synced_count: 1}} = admin_mutation(ctx.conn, :sync_billing_products_from_polar, %{})
      end

      product = Billing.get_product_by_polar_product_id("prod_enterprise_monthly")
      assert product.plan_family == "enterprise"
      assert product.billing_interval == :monthly

      plan_definition =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "enterprise"))

      assert plan_definition.display_name == "Enterprise"
      assert plan_definition.billing_behavior == :provider_managed
    end
  end
end
