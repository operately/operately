defmodule Operately.Repo.Migrations.AddEmailActivationCodes do
  use Ecto.Migration

  def change do
    create table(:email_activation_codes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :code, :string, null: false
      add :expires_at, :utc_datetime_usec, null: false

      timestamps()
    end

    create unique_index(:email_activation_codes, [:code])
  end
end
