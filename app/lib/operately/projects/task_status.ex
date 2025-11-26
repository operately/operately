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
end
