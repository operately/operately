defmodule Operately.Repo.Migrations.ConnectTenetsWithCompany do
  use Ecto.Migration

  def change do
    alter table(:tenets) do
      add :company_id, references(:companies, type: :binary_id)
    end

    create index(:tenets, [:company_id])
  end
end
