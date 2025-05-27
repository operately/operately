defmodule Operately.Repo.Migrations.CascadeDeleteFromCompaniesToAccessContexts do
  use Ecto.Migration

  def up do
    drop constraint(:access_contexts, :access_contexts_company_id_fkey)

    alter table(:access_contexts) do
      modify :company_id, references(:companies, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_contexts, :access_contexts_company_id_fkey)

    alter table(:access_contexts) do
      modify :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
