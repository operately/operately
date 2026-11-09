defmodule Operately.Repo.Migrations.AddSpaceTaskBoards do
  use Ecto.Migration

  def change do
    create table(:task_boards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :space_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :task_statuses, {:array, :jsonb}, default: []
      add :tasks_kanban_state, :map, default: %{}
      add :position, :integer, default: 0, null: false
      add :archived_at, :naive_datetime
      timestamps()
    end

    create index(:task_boards, [:space_id, :position])
    create unique_index(:task_boards, [:id, :space_id])

    alter table(:tasks) do
      add :board_id,
          references(:task_boards,
            type: :binary_id,
            with: [space_id: :space_id],
            on_delete: :nothing
          )
    end

    create index(:tasks, [:board_id])

    create constraint(:tasks, :tasks_board_requires_space,
             check: "board_id IS NULL OR (space_id IS NOT NULL AND project_id IS NULL)"
           )

    alter table(:groups) do
      add :default_task_board_id,
          references(:task_boards, type: :binary_id, with: [id: :space_id], on_delete: :nothing)
    end

    create index(:groups, [:default_task_board_id])
  end
end
