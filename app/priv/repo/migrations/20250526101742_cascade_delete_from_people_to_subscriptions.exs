defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToSubscriptions do
  use Ecto.Migration

  def up do
    drop constraint(:subscriptions, :subscriptions_person_id_fkey)

    alter table(:subscriptions) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:subscriptions, :subscriptions_person_id_fkey)

    alter table(:subscriptions) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end
