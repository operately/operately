defmodule OperatelyEE.AdminApi.Mutations.UpdateUpdateBadgeSettingsTest do
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
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_update_badge_settings, %{enabled: false})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_update_badge_settings, %{enabled: false})
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

    test "disables the update badge for the instance", ctx do
      assert {200, %{success: true, enabled: false}} =
               admin_mutation(ctx.conn, :update_update_badge_settings, %{enabled: false})

      refute SystemSettings.update_badge_enabled?()
    end

    test "re-enables the update badge for the instance", ctx do
      assert {:ok, _} = SystemSettings.upsert(%{update_badge_enabled: false})
      Cache.refresh()

      assert {200, %{success: true, enabled: true}} =
               admin_mutation(ctx.conn, :update_update_badge_settings, %{enabled: true})

      assert SystemSettings.update_badge_enabled?()
    end
  end
end
