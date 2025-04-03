defmodule Operately.Repo.Migrations.DropIndexFromTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      remove :index
    end
  end
end
