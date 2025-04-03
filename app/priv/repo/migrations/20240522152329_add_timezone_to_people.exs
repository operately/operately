defmodule Operately.Repo.Migrations.AddTimezoneToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :timezone, :string
    end
  end
end
