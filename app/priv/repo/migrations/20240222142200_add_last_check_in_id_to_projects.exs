defmodule Operately.Repo.Migrations.AddLastCheckInIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :last_check_in_id, references(:project_check_ins, type: :binary_id)
    end
  end
end
