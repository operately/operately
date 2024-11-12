defmodule Operately.Repo.Migrations.RenameNodeFolderFieldToParentField do
  use Ecto.Migration

  def change do
    rename table(:resource_nodes), :folder_id, to: :parent_folder_id

    drop index(:resource_nodes, [:folder_id])
    create index(:resource_nodes, [:parent_folder_id])
  end
end
