defmodule OperatelyEE.AdminApi.Mutations.ArchiveBillingProductTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Billing

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :archive_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
      })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :archive_billing_product, %{
        id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
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

    test "archives a billing product", ctx do
      {:ok, product} = Billing.create_product(%{
        provider: "polar",
        plan_family: "team",
        billing_interval: "monthly",
        polar_product_id: "prod_to_archive",
        polar_product_name: "To Archive",
        price_amount: 2900,
        price_currency: "usd",
      })

      refute product.archived_at

      assert {200, %{product: _}} = admin_mutation(ctx.conn, :archive_billing_product, %{
        id: Operately.ShortUuid.encode!(product.id),
      })

      archived = Repo.get!(Operately.Billing.ProductCatalogEntry, product.id)
      assert archived.archived_at
    end
  end
end
