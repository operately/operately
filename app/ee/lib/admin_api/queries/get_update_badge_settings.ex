defmodule OperatelyEE.AdminApi.Queries.GetUpdateBadgeSettings do
  use TurboConnect.Query

  outputs do
    field :enabled, :boolean, null: false
  end

  def call(_conn, _inputs) do
    {:ok, %{enabled: Operately.SystemSettings.update_badge_enabled?()}}
  end
end
