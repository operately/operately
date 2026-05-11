defmodule Operately.Operations.AccountSiteAdminUpdatingTest do
  use Operately.DataCase

  alias Operately.Operations.AccountSiteAdminUpdating
  alias Operately.People.Account
  alias Operately.Support.Factory

  describe "promote/1" do
    test "promotes a normal account", ctx do
      ctx = Factory.setup(ctx)

      refute ctx.account.site_admin

      assert {:ok, promoted_account} = AccountSiteAdminUpdating.promote(Repo.get!(Account, ctx.account.id))
      assert promoted_account.site_admin

      persisted_account = Repo.get!(Account, ctx.account.id)
      assert persisted_account.site_admin
    end
  end

  describe "demote/1" do
    test "demotes a site admin when another site admin exists", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:other_site_admin)

      {:ok, _} = Account.promote_to_admin(ctx.account)
      {:ok, _} = Account.promote_to_admin(ctx.other_site_admin)

      assert {:ok, demoted_account} = AccountSiteAdminUpdating.demote(Repo.get!(Account, ctx.account.id))
      refute demoted_account.site_admin

      persisted_account = Repo.get!(Account, ctx.account.id)
      refute persisted_account.site_admin
    end

    test "blocks demoting the last remaining site admin", ctx do
      ctx = Factory.setup(ctx)

      {:ok, _} = Account.promote_to_admin(ctx.account)

      assert {:error, :last_site_admin} = AccountSiteAdminUpdating.demote(Repo.get!(Account, ctx.account.id))

      persisted_account = Repo.get!(Account, ctx.account.id)
      assert persisted_account.site_admin
    end
  end
end
