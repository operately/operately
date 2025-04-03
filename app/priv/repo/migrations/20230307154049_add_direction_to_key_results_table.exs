defmodule Operately.Repo.Migrations.AddDirectionToKeyResultsTable do
  use Ecto.Migration

  def change do
    alter table(:key_results) do
      add :direction, :string
    end
  end
end
