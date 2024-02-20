defmodule Operately.Repo.Migrations.AddIndexToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :index, :string
    end
  end
end
