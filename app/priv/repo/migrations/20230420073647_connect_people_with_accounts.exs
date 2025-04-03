defmodule Operately.Repo.Migrations.ConnectPeopleWithAccounts do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :account_id, references(:accounts, on_delete: :delete_all, type: :binary_id)
      add :avatar_url, :string
      add :email, :string
    end
  end
end
