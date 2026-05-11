defmodule OperatelyEE.AdminApi.Mutations.DemoteAccountFromSiteAdminTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :demote_account_from_site_admin, %{account_id: Ecto.UUID.generate()})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :demote_account_from_site_admin, %{account_id: ctx.account.id})
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

    test "demotes a site admin account when another site admin exists", ctx do
      ctx = Factory.add_account(ctx, :other_site_admin)

      {:ok, _} = Account.promote_to_admin(ctx.other_site_admin)
      {:ok, _} = Account.promote_to_admin(ctx.target_account)

      assert Repo.get!(Account, ctx.target_account.id).site_admin

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :demote_account_from_site_admin, %{account_id: ctx.target_account.id})

      refute Repo.get!(Account, ctx.target_account.id).site_admin
    end

    test "returns a useful error when the target is the last site admin", ctx do
      assert {200, %{success: false, error: error}} =
               admin_mutation(ctx.conn, :demote_account_from_site_admin, %{account_id: ctx.account.id})

      assert error =~ "Promote another account to site admin first"
      assert Repo.get!(Account, ctx.account.id).site_admin
    end
  end
end
