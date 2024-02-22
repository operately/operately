defmodule Operately.Repo.Migrations.IntroduceProjectCheckInsTable do
  use Ecto.Migration

  def change do
    create table(:project_check_ins) do
      add :project_id, references(:projects, type: :binary_id), null: false
      add :status, :string, null: false
      add :description, :map

      timestamps()
    end
  end
end
