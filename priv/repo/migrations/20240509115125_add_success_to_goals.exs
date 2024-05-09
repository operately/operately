defmodule Operately.Repo.Migrations.AddSuccessToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :success, :string
    end
  end
end
