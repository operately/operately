defmodule Operately.Repo.Migrations.CreateSubscriptionLists do
  use Ecto.Migration

  def change do
    create table(:subscription_lists, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :parent_id, :uuid
      add :parent_type, :string
      add :send_to_everyone, :boolean, default: false, null: false

      timestamps()
    end
  end
end
