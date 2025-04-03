defmodule Operately.Repo.Migrations.AddValueToTargets do
  use Ecto.Migration

  def change do
    alter table(:targets) do
      add :value, :float, default: 0.0
    end
  end
end
