defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingProductTest do
  use OperatelyWeb.TurboCase
  import Mock

  alias Operately.People.Account
  alias Operately.Billing
  alias Operately.Billing.Polar.ProductMapper

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

    test "updates a billing product and rewrites enriched metadata", ctx do
      {:ok, product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "unlimited",
          billing_interval: "yearly",
          polar_product_id: "prod_original",
          polar_product_name: "Original",
          price_amount: 2900,
          price_currency: "usd"
        })

      plan_definition =
        Billing.list_plan_definitions()
        |> Enum.find(&(&1.plan_key == "unlimited"))

      {200, %{product: updated}} =
        with_mock Operately.Billing.Polar.Client,
          update_product: fn "prod_original", attrs ->
            assert attrs.metadata == ProductMapper.metadata(plan_definition, :yearly, 1)

            {:ok,
             %{
               "id" => "prod_original",
               "name" => "Updated Name",
               "recurring_interval" => "yearly",
               "prices" => [%{"amount_type" => "fixed", "price_amount" => 3900, "price_currency" => "usd"}],
               "metadata" => attrs.metadata,
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
      assert updated.plan_family == "unlimited"
      assert updated.billing_interval == "yearly"
    end

    test "returns error for non-existent product", ctx do
      assert {404, _} = admin_mutation(ctx.conn, :update_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
        polar_product_name: "Updated",
      })
    end
  end
end
