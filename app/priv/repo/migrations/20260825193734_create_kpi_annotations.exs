defmodule Operately.Repo.Migrations.CreateKpiAnnotations do
  use Ecto.Migration

  def change do
    create table(:kpi_annotations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :kpi_id, references(:kpis, on_delete: :delete_all, type: :binary_id), null: false
      add :date, :date, null: false
      add :title, :string, null: false
      add :description, :string
      add :created_by_id, references(:people, on_delete: :nilify_all, type: :binary_id)

      timestamps()
    end

    create index(:kpi_annotations, [:kpi_id])
    create index(:kpi_annotations, [:kpi_id, :date])
  end
end
