defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToProjectCheckIns do
  use Ecto.Migration

  def up do
    drop constraint(:project_check_ins, :project_check_ins_author_id_fkey)

    alter table(:project_check_ins) do
      modify :author_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:project_check_ins, :project_check_ins_author_id_fkey)

    alter table(:project_check_ins) do
      modify :author_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end
