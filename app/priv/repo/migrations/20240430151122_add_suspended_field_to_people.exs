defmodule Operately.Repo.Migrations.AddSuspendedFieldToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :suspended, :boolean, default: false
    end
  end
end
