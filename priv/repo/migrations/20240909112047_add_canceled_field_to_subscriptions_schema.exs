defmodule Operately.Repo.Migrations.AddCanceledFieldToSubscriptionsSchema do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      add :canceled, :boolean, default: false, null: false
    end
  end
end
