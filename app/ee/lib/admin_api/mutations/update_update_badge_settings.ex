defmodule OperatelyEE.AdminApi.Mutations.UpdateUpdateBadgeSettings do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.People.Account
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Cache

  inputs do
    field :enabled, :boolean, null: false
  end

  outputs do
    field :success, :boolean, null: false
    field :enabled, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, account} <- find_account(conn),
         true <- Account.is_site_admin?(account) || {:error, :forbidden},
         {:ok, settings} <- SystemSettings.upsert(%{update_badge_enabled: inputs.enabled}) do
      Cache.refresh()
      {:ok, %{success: true, enabled: settings.update_badge_enabled}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, %Ecto.Changeset{}} -> {:error, :bad_request}
    end
  end
end
