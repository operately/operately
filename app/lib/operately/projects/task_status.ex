defmodule Operately.Projects.TaskStatus do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  @valid_colors [:gray, :blue, :green, :red]

  embedded_schema do
    field :id, :string
    field :label, :string
    field :color, Ecto.Enum, values: @valid_colors
    field :index, :integer
    field :value, :string
    field :closed, :boolean, default: false
  end

  def changeset(task_status, attrs) do
    task_status
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:id, :label, :color, :index])
  end

  @doc """
  Returns the default task statuses for a project.
  """
  def default_task_statuses do
    [
      %__MODULE__{
        id: Ecto.UUID.generate(),
        label: "Not started",
        color: :gray,
        value: "pending",
        index: 0,
        closed: false
      },
      %__MODULE__{
        id: Ecto.UUID.generate(),
        label: "In progress",
        color: :blue,
        value: "in_progress",
        index: 1,
        closed: false
      },
      %__MODULE__{
        id: Ecto.UUID.generate(),
        label: "Done",
        color: :green,
        value: "done",
        index: 2,
        closed: true
      },
      %__MODULE__{
        id: Ecto.UUID.generate(),
        label: "Canceled",
        color: :red,
        value: "canceled",
        index: 3,
        closed: true
      }
    ]
  end

  @doc """
  Returns the default task status for a task.
  """
  def default_task_status do
    %__MODULE__{
      id: Ecto.UUID.generate(),
      label: "Not started",
      color: :gray,
      value: "pending",
      index: 0,
      closed: false
    }
  end

  def valid_colors, do: @valid_colors
end
