defmodule OperatelyEE.AdminApi.Mutations.SyncBillingProductsFromPolarTest do
  use OperatelyWeb.TurboCase

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

    test "returns success with count from stub sync", ctx do
      assert {200, %{success: true, synced_count: 0}} = admin_mutation(ctx.conn, :sync_billing_products_from_polar, %{})
    end
  end
end
