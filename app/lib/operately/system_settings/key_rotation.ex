defmodule Operately.SystemSettings.KeyRotation do
  @moduledoc false

  alias Operately.Repo
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Settings
  alias Ecto.Changeset

  def rotate do
    case SystemSettings.get() do
      nil -> {:error, :not_configured}
      settings ->
        settings
        |> Settings.changeset(%{})
        |> Changeset.force_change(:email_secrets, settings.email_secrets)
        |> Repo.update()
    end
  end
end
