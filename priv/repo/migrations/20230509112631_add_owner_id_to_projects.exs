defmodule Operately.Repo.Migrations.AddOwnerIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :owner_id, references(:people, type: :binary_id)
    end

    create index(:projects, [:owner_id])
  end
end
