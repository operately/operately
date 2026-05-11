defmodule OperatelyEE.AdminApi.Mutations.PromoteAccountToSiteAdminTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :promote_account_to_site_admin, %{account_id: Ecto.UUID.generate()})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :promote_account_to_site_admin, %{account_id: ctx.account.id})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:target_account)

      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "promotes a normal account to site admin", ctx do
      refute Repo.get!(Account, ctx.target_account.id).site_admin

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :promote_account_to_site_admin, %{account_id: ctx.target_account.id})

      assert Repo.get!(Account, ctx.target_account.id).site_admin
    end
  end
end
