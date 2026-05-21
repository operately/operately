defmodule OperatelyEE.AdminApi.Queries.ListBillingProductsTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Billing

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_billing_products, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_billing_products, %{})
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

    test "returns an empty list when no products exist", ctx do
      assert {200, %{products: []}} = admin_query(ctx.conn, :list_billing_products, %{})
    end

    test "returns all products including archived", ctx do
      {:ok, active} = Billing.create_product(%{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_team_monthly",
        polar_product_name: "Team Monthly",
        price_amount: 2900,
        price_currency: "usd",
        active: true,
      })

      {:ok, inactive} = Billing.create_product(%{
        provider: "polar",
        plan_family: "business",
        billing_interval: "yearly",
        polar_product_id: "prod_business_yearly",
        polar_product_name: "Business Yearly",
        price_amount: 99000,
        price_currency: "usd",
        active: false,
      })

      assert {200, %{products: products}} = admin_query(ctx.conn, :list_billing_products, %{})
      assert length(products) == 2

      ids = Enum.map(products, & &1.id)
      assert Operately.ShortUuid.encode!(active.id) in ids
      assert Operately.ShortUuid.encode!(inactive.id) in ids
    end
  end
end
