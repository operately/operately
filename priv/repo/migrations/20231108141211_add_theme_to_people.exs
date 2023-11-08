defmodule Operately.Repo.Migrations.AddThemeToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :theme, :string
    end
  end
end
