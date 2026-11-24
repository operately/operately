defmodule Operately.Repo.Migrations.CreateWorkMapSettings do
  use Ecto.Migration

  def change do
    create table(:work_map_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all)
      add :space_id, references(:groups, type: :binary_id, on_delete: :delete_all)
      add :default_view, :map
      add :ordered_item_ids, {:array, :uuid}, null: false, default: []
      add :pinned_kpi_ids, {:array, :uuid}, null: false, default: []
    end

    create unique_index(:work_map_settings, [:company_id])
    create unique_index(:work_map_settings, [:space_id])

    create constraint(:work_map_settings, :one_scope,
             check: "num_nonnulls(company_id, space_id) = 1"
           )
  end
end
