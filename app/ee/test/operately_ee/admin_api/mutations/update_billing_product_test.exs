defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingProductTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.People.Account
  alias Operately.Billing

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
        polar_product_name: "Updated",
      })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
        polar_product_name: "Updated",
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

    test "updates a billing product", ctx do
      {:ok, product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_original",
          polar_product_name: "Original",
          price_amount: 2900,
          price_currency: "usd"
        })

      {200, %{product: updated}} =
        with_mock Operately.Billing.Polar.Client,
          update_product: fn "prod_original", _attrs ->
            {:ok,
             %{
               "id" => "prod_original",
               "name" => "Updated Name",
               "recurring_interval" => "monthly",
               "prices" => [%{"amount_type" => "fixed", "price_amount" => 3900, "price_currency" => "usd"}],
               "metadata" => %{
                 "operately_managed" => "true",
                 "operately_plan_family" => "team",
                 "operately_billing_interval" => "monthly",
                 "operately_version" => 1
               },
               "is_archived" => false
             }}
          end do
          admin_mutation(ctx.conn, :update_billing_product, %{
            id: Operately.ShortUuid.encode!(product.id),
            polar_product_name: "Updated Name",
            price_amount: 3900
          })
        end

      assert updated.polar_product_name == "Updated Name"
      assert updated.price_amount == 3900
      assert updated.plan_family == "team"
      assert updated.billing_interval == "monthly"
    end

    test "returns error for non-existent product", ctx do
      assert {404, _} = admin_mutation(ctx.conn, :update_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
        polar_product_name: "Updated",
      })
    end
  end
end
