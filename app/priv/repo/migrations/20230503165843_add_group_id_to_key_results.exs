defmodule Operately.Repo.Migrations.AddGroupIdToKeyResults do
  use Ecto.Migration

  def change do
    alter table(:key_results) do
      add :group_id, references(:groups, type: :binary_id)
    end

    create index(:key_results, [:group_id])
  end
end
