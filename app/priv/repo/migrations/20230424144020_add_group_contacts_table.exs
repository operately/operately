defmodule Operately.Repo.Migrations.AddGroupContactsTable do
  use Ecto.Migration

  def change do
    create table(:contacts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :group_id, references(:groups, on_delete: :delete_all, type: :binary_id)
      add :name, :string
      add :value, :string
      add :type, :string

      timestamps()
    end

    create index(:contacts, [:group_id])
  end
end
