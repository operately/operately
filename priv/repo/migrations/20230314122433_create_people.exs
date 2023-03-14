defmodule Operately.Repo.Migrations.CreatePeople do
  use Ecto.Migration

  def change do
    create table(:people, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :full_name, :string
      add :handle, :string
      add :title, :string

      timestamps()
    end

    create unique_index(:people, [:handle])
  end
end
