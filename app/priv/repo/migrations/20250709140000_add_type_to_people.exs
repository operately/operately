defmodule Operately.Repo.Migrations.AddTypeToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :type, :string, null: false, default: "human"
    end
  end
end
