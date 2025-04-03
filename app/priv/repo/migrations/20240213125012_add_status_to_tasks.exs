defmodule Operately.Repo.Migrations.AddStatusToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :status, :string, default: "open"
    end
  end
end
