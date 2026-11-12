defmodule Operately.Repo.Migrations.PrepareProjectTaskBoards do
  use Ecto.Migration

  # Preparation only: the data backfill runs during the coordinated cutover.
  def up do
    alter table(:task_boards) do
      add :project_id, references(:projects, type: :binary_id, on_delete: :delete_all)
      modify :space_id, :binary_id, null: true
    end

    create unique_index(:task_boards, [:project_id])

    create constraint(:task_boards, :task_boards_requires_owner,
             check: "(space_id IS NOT NULL) <> (project_id IS NOT NULL)"
           )

    drop constraint(:tasks, :tasks_board_requires_space)

    create constraint(:tasks, :tasks_board_requires_owner,
             check: "board_id IS NULL OR ((space_id IS NOT NULL) <> (project_id IS NOT NULL))"
           )
  end

  def down do
    # Intentionally fails once project boards exist; never discard backfilled data.
    drop constraint(:tasks, :tasks_board_requires_owner)

    create constraint(:tasks, :tasks_board_requires_space,
             check: "board_id IS NULL OR (space_id IS NOT NULL AND project_id IS NULL)"
           )

    alter table(:task_boards) do
      modify :space_id, :binary_id, null: false
    end

    drop constraint(:task_boards, :task_boards_requires_owner)
    drop unique_index(:task_boards, [:project_id])

    alter table(:task_boards) do
      remove :project_id
    end
  end
end
