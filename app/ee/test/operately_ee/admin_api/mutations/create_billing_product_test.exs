defmodule OperatelyEE.AdminApi.Mutations.CreateBillingProductTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :create_billing_product, %{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_test",
        polar_product_name: "Test",
        price_amount: 100,
        price_currency: "usd",
      })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :create_billing_product, %{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_test",
        polar_product_name: "Test",
        price_amount: 100,
        price_currency: "usd",
      })
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "creates a new billing product", ctx do
      assert {200, %{product: product}} = admin_mutation(ctx.conn, :create_billing_product, %{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_team_monthly",
        polar_product_name: "Team Monthly",
        price_amount: 2900,
        price_currency: "usd",
      })

      assert product.provider == "polar"
      assert product.plan_family == "team"
      assert product.billing_interval == "monthly"
      assert product.polar_product_name == "Team Monthly"
      assert product.price_amount == 2900
      assert product.price_currency == "usd"
    end

    test "returns error with invalid params", ctx do
      assert {400, _} = admin_mutation(ctx.conn, :create_billing_product, %{
        provider: "polar",
        plan_family: "invalid",
        billing_interval: "monthly",
        polar_product_id: "prod_test",
        polar_product_name: "Test",
        price_amount: 100,
        price_currency: "usd",
      })
    end
  end
end
