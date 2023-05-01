defmodule Operately.Repo.Migrations.AddOwnerIdToKeyResults do
  use Ecto.Migration

  def change do
    alter table(:key_results) do
      add :owner_id, references(:people, type: :binary_id)
    end

    create index(:key_results, [:owner_id])
  end
end
