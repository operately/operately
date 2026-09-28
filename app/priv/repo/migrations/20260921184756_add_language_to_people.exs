defmodule Operately.Repo.Migrations.AddLanguageToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :language, :string
    end
  end
end
