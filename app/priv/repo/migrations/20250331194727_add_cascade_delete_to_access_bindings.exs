defmodule Operately.Repo.Migrations.AddCascadeDeleteToAccessBindings do
  use Ecto.Migration

  def up do
    drop constraint(:access_bindings, "access_bindings_context_id_fkey")

    alter table(:access_bindings) do
      modify :context_id, references(:access_contexts, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_bindings, "access_bindings_context_id_fkey")

    alter table(:access_bindings) do
      modify :context_id, references(:access_contexts, on_delete: :nothing, type: :binary_id)
    end
  end
end
