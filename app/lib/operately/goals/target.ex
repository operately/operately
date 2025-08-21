defmodule Operately.Goals.Target do
  use Operately.Schema

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

  def done?(target = %__MODULE__{}) do
    cond do
      target.from < target.to -> target.value < target.to
      target.from > target.to -> target.value > target.to
      true -> false
    end
  end

  def target_progress_percentage(target = %__MODULE__{}) do
    from = target.from
    to = target.to
    current = target.value

    cond do
      from == to ->
        0

      from < to ->
        cond do
          current > to -> 100
          current < from -> 0
          true -> (current - from) / (to - from) * 100
        end

      from > to ->
        cond do
          current < to -> 100
          current > from -> 0
          true -> (from - current) / (from - to) * 100
        end
    end
  end
end
