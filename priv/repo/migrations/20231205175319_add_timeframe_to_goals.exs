defmodule Operately.Repo.Migrations.AddTimeframeToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :timeframe, :string
    end
  end
end
