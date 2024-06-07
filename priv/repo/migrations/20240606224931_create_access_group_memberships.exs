defmodule Operately.Repo.Migrations.CreateAccessGroupMemberships do
  use Ecto.Migration

  def change do
    create table(:access_group_memberships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :access_group_id, references(:access_groups, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:access_group_memberships, [:person_id])
    create index(:access_group_memberships, [:access_group_id])
  end
end
