defmodule Operately.Repo.Migrations.AddGroupIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :group_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end

    create index(:projects, [:group_id])
  end
end
