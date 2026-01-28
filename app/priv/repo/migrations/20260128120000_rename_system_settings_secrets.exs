defmodule Operately.Repo.Migrations.RenameSystemSettingsSecrets do
  use Ecto.Migration

  def change do
    rename table(:system_settings), :secrets, to: :email_secrets
  end
end
