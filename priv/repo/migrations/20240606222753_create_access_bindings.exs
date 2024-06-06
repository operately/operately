defmodule Operately.Repo.Migrations.CreateAccessBindings do
  use Ecto.Migration

  def change do
    create table(:access_bindings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :access_level, :string
      add :access_group_id, references(:access_groups, on_delete: :nothing, type: :binary_id)
      add :access_context_id, references(:access_contexts, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:access_bindings, [:access_group_id])
    create index(:access_bindings, [:access_context_id])
  end
end
