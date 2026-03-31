defmodule Operately.Repo.Migrations.AddUniqueConstraintToSubscriptions do
  use Ecto.Migration

  def change do
    create unique_index(:subscriptions, [:subscription_list_id, :person_id])
  end
end
