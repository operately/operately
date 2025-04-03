defmodule Operately.Repo.Migrations.AddCompanyIdToBlobs do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
