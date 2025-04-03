defmodule Operately.Repo.Migrations.AddTimeframeJsonbToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :timeframe, :jsonb
    end
  end
end
