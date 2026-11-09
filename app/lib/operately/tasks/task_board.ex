defmodule Operately.Tasks.TaskBoard do
  use Operately.Schema

  schema "task_boards" do
    belongs_to :space, Operately.Groups.Group

    has_many :tasks, Operately.Tasks.Task, foreign_key: :board_id
    embeds_many :task_statuses, Operately.Tasks.Status, on_replace: :delete

    field :name, :string
    field :tasks_kanban_state, :map, default: %{}
    field :position, :integer, default: 0
    field :archived_at, :naive_datetime

    timestamps()
  end
end
