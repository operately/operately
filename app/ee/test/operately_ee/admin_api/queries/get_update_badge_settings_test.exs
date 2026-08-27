defmodule OperatelyEE.AdminApi.Queries.GetUpdateBadgeSettingsTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Repo
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Cache

  setup do
    Cache.clear()
    on_exit(fn -> Cache.clear() end)
    :ok
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_update_badge_settings, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_update_badge_settings, %{})
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

    test "returns enabled by default", ctx do
      assert {200, %{enabled: true}} = admin_query(ctx.conn, :get_update_badge_settings, %{})
    end

    test "returns the stored value", ctx do
      assert {:ok, _} = SystemSettings.upsert(%{update_badge_enabled: false})
      Cache.refresh()

      assert {200, %{enabled: false}} = admin_query(ctx.conn, :get_update_badge_settings, %{})
    end
  end
end
