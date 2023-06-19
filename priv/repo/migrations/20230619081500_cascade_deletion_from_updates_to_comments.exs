defmodule Operately.Repo.Migrations.CascadeDeletionFromUpdatesToComments do
  use Ecto.Migration

  def change do
    drop constraint(:comments, :comments_update_id_fkey)

    alter table(:comments) do
      modify :update_id, references(:updates, on_delete: :delete_all, type: :uuid)
    end
  end
end
