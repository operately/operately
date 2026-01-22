defmodule Operately.Repo.Migrations.AddDescriptionToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :description, :map
    end
  end
end
