defmodule Operately.Goals.Target do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "targets" do
    belongs_to(:goal, Operately.Goals.Goal)

    field(:from, :float)
    field(:name, :string)
    field(:to, :float)
    field(:unit, :string)
    field(:index, :integer)

    field(:value, :float)

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(target, attrs) do
    target
    |> cast(attrs, [:name, :from, :to, :unit, :goal_id, :index, :value])
    |> validate_required([:name, :from, :to, :unit, :goal_id, :index, :value])
  end

  @doc """
  Formats a target value according to its type and unit.
  Handles both integer and float values, ensuring consistent display.
  """
  def format_value(%__MODULE__{value: value, unit: unit}) when is_number(value) do
    formatted_value =
      cond do
        is_integer(value) -> value
        value == trunc(value) -> trunc(value)
        true -> Float.round(value, 2)
      end

    if unit == "%", do: "#{formatted_value}%", else: "#{formatted_value} #{unit}"
  end
end
