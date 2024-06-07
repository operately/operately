defmodule Operately.Repo.Migrations.CreateAccessBindings do
  use Ecto.Migration

  def change do
    create table(:access_bindings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :access_level, :integer
      add :group_id, references(:access_groups, on_delete: :nothing, type: :binary_id)
      add :context_id, references(:access_contexts, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:access_bindings, [:group_id])
    create index(:access_bindings, [:context_id])
  end
end
