defmodule Operately.SystemSettingsTest do
  use Operately.DataCase

  alias Operately.SystemSettings
  alias Operately.SystemSettings.Cache

  setup do
    Cache.clear()
    on_exit(fn -> Cache.clear() end)
    :ok
  end

  test "update_badge_enabled?/0 defaults to true when settings are missing" do
    assert SystemSettings.update_badge_enabled?()
  end

  test "update_badge_enabled?/0 reflects the stored value" do
    assert {:ok, _} = SystemSettings.upsert(%{update_badge_enabled: false})
    Cache.refresh()

    refute SystemSettings.update_badge_enabled?()

    assert {:ok, _} = SystemSettings.upsert(%{update_badge_enabled: true})
    Cache.refresh()

    assert SystemSettings.update_badge_enabled?()
  end
end
