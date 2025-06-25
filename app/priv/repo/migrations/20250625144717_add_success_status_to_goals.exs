defmodule Operately.Repo.Migrations.AddSuccessStatusToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :success_status, :string
    end
  end
end
