defmodule Operately.Repo.Migrations.CreateSubscriptions do
  use Ecto.Migration

  def change do
    create table(:subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :type, :string
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:subscriptions, [:subscription_list_id])
    create index(:subscriptions, [:person_id])
  end
end
