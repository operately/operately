defmodule Operately.SystemSettings.KeyRotation do
  @moduledoc false

  alias Operately.Repo
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Settings

  def rotate do
    case SystemSettings.get() do
      nil -> {:error, :not_configured}
      settings -> settings |> Settings.changeset(%{email_secrets: settings.email_secrets}) |> Repo.update()
    end
  end
end
