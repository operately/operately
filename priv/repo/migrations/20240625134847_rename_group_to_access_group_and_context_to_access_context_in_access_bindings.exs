defmodule Operately.Repo.Migrations.RenameGroupToAccessGroupAndContextToAccessContextInAccessBindings do
  use Ecto.Migration

  def change do
    rename table(:access_bindings), :group_id, to: :access_group_id
    rename table(:access_bindings), :context_id, to: :access_context_id
  end
end
