defmodule Operately.Repo.Migrations.RenameGroupIdToAccessGroupIdInGroupMemberships do
  use Ecto.Migration

  def change do
    rename table(:access_group_memberships), :group_id, to: :access_group_id
  end
end
