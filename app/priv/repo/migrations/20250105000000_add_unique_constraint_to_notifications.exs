defmodule Operately.Repo.Migrations.AddUniqueConstraintToNotifications do
  use Ecto.Migration

  def change do
    # First, remove any duplicate notifications that may already exist
    execute """
    DELETE FROM notifications n1 
    USING notifications n2 
    WHERE n1.id > n2.id 
    AND n1.activity_id = n2.activity_id 
    AND n1.person_id = n2.person_id
    """

    # Add unique constraint to prevent future duplicates
    create unique_index(:notifications, [:activity_id, :person_id], 
      name: :notifications_activity_person_unique_index)
  end
end