defmodule OperatelyEE.AdminApi.Mutations.CreateBillingProductTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.Billing
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :create_billing_product, %{
                 plan_family: "team",
                 billing_interval: "monthly",
                 polar_product_name: "Test",
                 price_amount: 100,
                 price_currency: "usd"
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :create_billing_product, %{
                 plan_family: "team",
                 billing_interval: "monthly",
                 polar_product_name: "Test",
                 price_amount: 100,
                 price_currency: "usd"
               })
    end
  end

  describe "functionality" do
    setup ctx do
      Application.put_env(:operately, :billing_enabled, true)
      on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "creates a new billing product", ctx do
      {200, %{product: product}} =
        with_mock Operately.Billing.Polar.Client,
          create_product: fn _attrs ->
            {:ok,
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
             }}
          end do
          admin_mutation(ctx.conn, :create_billing_product, %{
            plan_family: "team",
            billing_interval: "monthly",
            polar_product_name: "Team Monthly",
            price_amount: 2900,
            price_currency: "usd"
          })
        end

      assert product.provider == "polar"
      assert product.plan_family == "team"
      assert product.billing_interval == "monthly"
      assert product.polar_product_id == "prod_team_monthly"
      assert product.polar_product_name == "Team Monthly"
      assert product.price_amount == 2900
      assert product.price_currency == "usd"
      assert product.version == 1
      refute product.active
    end

    test "creates a product for a newly added provider-managed plan without code changes", ctx do
      {:ok, _plan_definition} =
        Billing.create_plan_definition(%{
          plan_key: "enterprise",
          display_name: "Enterprise",
          tier_rank: 8,
          billing_behavior: :provider_managed,
          customer_selectable: true,
          member_limit: 500,
          storage_limit_bytes: 5_497_558_138_880
        })

      {200, %{product: product}} =
        with_mock Operately.Billing.Polar.Client,
          create_product: fn _attrs ->
            {:ok,
             %{
               "id" => "prod_enterprise_monthly",
               "name" => "Enterprise Monthly",
               "recurring_interval" => "monthly",
               "prices" => [%{"amount_type" => "fixed", "price_amount" => 19_900, "price_currency" => "usd"}],
               "metadata" => %{
                 "operately_managed" => "true",
                 "operately_plan_family" => "enterprise",
                 "operately_billing_interval" => "monthly",
                 "operately_version" => 1
               },
               "is_archived" => false
             }}
          end do
          admin_mutation(ctx.conn, :create_billing_product, %{
            plan_family: "enterprise",
            billing_interval: "monthly",
            polar_product_name: "Enterprise Monthly",
            price_amount: 19_900,
            price_currency: "usd"
          })
        end

      assert product.plan_family == "enterprise"
      assert product.polar_product_id == "prod_enterprise_monthly"
    end

    test "rejects internal plans", ctx do
      {:ok, _plan_definition} =
        Billing.create_plan_definition(%{
          plan_key: "internal_support",
          display_name: "Internal Support",
          tier_rank: 9,
          billing_behavior: :internal,
          customer_selectable: false,
          member_limit: 100,
          storage_limit_bytes: nil
        })

      assert {400, _} =
               admin_mutation(ctx.conn, :create_billing_product, %{
                 plan_family: "internal_support",
                 billing_interval: "monthly",
                 polar_product_name: "Internal Support Monthly",
                 price_amount: 100,
                 price_currency: "usd"
               })
    end

    test "returns error with invalid params", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :create_billing_product, %{
                 plan_family: "invalid",
                 billing_interval: "monthly",
                 polar_product_name: "Test",
                 price_amount: 100,
                 price_currency: "usd"
               })
    end

    test "returns an error when billing is disabled", ctx do
      Application.put_env(:operately, :billing_enabled, false)
      on_exit(fn -> Application.put_env(:operately, :billing_enabled, true) end)

      assert {400, _} =
               admin_mutation(ctx.conn, :create_billing_product, %{
                 plan_family: "team",
                 billing_interval: "monthly",
                 polar_product_name: "Test",
                 price_amount: 100,
                 price_currency: "usd"
               })
    end
  end
end
