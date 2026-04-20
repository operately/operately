defmodule Operately.Repo.Migrations.RemoveUpdateIdFromComments do
  use Ecto.Migration

  def change do
    drop_if_exists index(:comments, [:update_id])

    alter table(:comments) do
      remove :update_id, references(:updates, on_delete: :delete_all, type: :binary_id)
    end
  end
end
