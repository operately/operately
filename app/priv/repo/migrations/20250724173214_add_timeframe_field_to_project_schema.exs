defmodule Operately.Repo.Migrations.AddTimeframeFieldToProjectSchema do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :timeframe, :jsonb
    end
  end
end
