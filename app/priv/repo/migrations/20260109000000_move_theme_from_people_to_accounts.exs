defmodule Operately.Repo.Migrations.MoveThemeFromPeopleToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :theme, :string
    end
  end
end
