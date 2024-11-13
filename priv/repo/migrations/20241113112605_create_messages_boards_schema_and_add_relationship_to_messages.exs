defmodule Operately.Repo.Migrations.CreateMessagesBoardsSchemaAndAddRelationshipToMessages do
  use Ecto.Migration

  def change do
    create table(:messages_boards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :space_id, references(:groups, on_delete: :nothing, type: :binary_id), null: true

      add :name, :string
      add :description, :map

      timestamps()
    end

    alter table(:messages) do
      add :messages_board_id, references(:messages_boards, on_delete: :nothing, type: :binary_id), null: true
    end

    create index(:messages_boards, [:space_id])
    create index(:messages, [:messages_board_id])
  end
end
