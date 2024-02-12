defmodule Operately.Tasks.Task do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "tasks" do
    field :description, :map
    field :due_date, :naive_datetime
    field :name, :string
    field :priority, :string
    field :size, :string
    field :assignee_id, :binary_id
    field :space_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(task, attrs) do
    task
    |> cast(attrs, [:name, :due_date, :description, :size, :priority])
    |> validate_required([:name, :due_date, :description, :size, :priority])
  end
end
