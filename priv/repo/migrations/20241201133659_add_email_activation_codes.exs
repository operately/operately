defmodule Operately.Repo.Migrations.AddEmailActivationCodes do
  use Ecto.Migration

  def change do
    create table(:email_activation_codes) do
      add :email, :string, null: false
      add :code, :string, null: false
      add :expires_at, :utc_datetime, null: false
    end
  end
end
