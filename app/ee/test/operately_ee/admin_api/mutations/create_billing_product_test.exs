defmodule OperatelyEE.AdminApi.Mutations.CreateBillingProductTest do
  use OperatelyWeb.TurboCase
  import Mock

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
