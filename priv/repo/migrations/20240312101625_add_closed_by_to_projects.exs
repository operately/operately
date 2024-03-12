defmodule Operately.Repo.Migrations.AddClosedByToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :closed_by_id, references(:people, type: :binary_id)
    end
  end
end
