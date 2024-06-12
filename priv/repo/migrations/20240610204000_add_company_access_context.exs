defmodule Operately.Repo.Migrations.AddCompanyAccessContext do
  use Ecto.Migration

  def change do
    alter table(:access_contexts) do
      add :company_id, references(:companies, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:company_id])
  end
end
