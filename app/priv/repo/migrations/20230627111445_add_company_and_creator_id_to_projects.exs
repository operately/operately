defmodule Operately.Repo.Migrations.AddCompanyAndCreatorIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :company_id, references(:companies, type: :binary_id)
      add :creator_id, references(:people, type: :binary_id)
    end

    create index(:projects, [:company_id])
  end
end
