defmodule Operately.Repo.Migrations.CascadeDeleteFromSpacesToMessageBoards do
  use Ecto.Migration

  def up do
    drop constraint(:messages_boards, :messages_boards_space_id_fkey)

    alter table(:messages_boards) do
      modify :space_id, references(:groups, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:messages_boards, :messages_boards_space_id_fkey)

    alter table(:messages_boards) do
      modify :space_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end
  end
end
