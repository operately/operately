defmodule Operately.ContextualDates.ContextualDate do
  use Ecto.Schema
  import Ecto.Changeset

  @valid_types [:day, :month, :quarter, :year]

  @primary_key false
  embedded_schema do
    field :date_type, Ecto.Enum, values: @valid_types
    field :value, :string
    field :date, :date
  end

  def changeset(contextual_date, %Operately.ContextualDates.ContextualDate{} = attrs) do
    changeset(contextual_date, Map.from_struct(attrs))
  end

  def changeset(contextual_date, attrs) do
    contextual_date
    |> cast(attrs, [:date_type, :value, :date])
    |> validate_required([:date_type, :value, :date])
    |> validate_contextual_date()
  end

  defp validate_contextual_date(changeset) do
    date_type = get_field(changeset, :date_type)
    validate_value_format(changeset, date_type)
  end

  defp validate_value_format(changeset, :day), do: changeset

  defp validate_value_format(changeset, :month) do
    value = get_field(changeset, :value)
    date = get_field(changeset, :date)
    date_str = Calendar.strftime(date, "%b %Y")

    if value == date_str do
      changeset
    else
      add_error(changeset, :value, "must be in 'Month Year' format (e.g., 'Jul 2025')")
    end
  end

  defp validate_value_format(changeset, :quarter) do
    date = get_field(changeset, :date)
    value = get_field(changeset, :value)
    date_str = "#{get_quarter(date)} #{date.year}"

    if value == date_str do
      changeset
    else
      add_error(changeset, :value, "must be a valid quarter format (Q1, Q2, Q3, Q4)")
    end
  end

  defp validate_value_format(changeset, :year) do
    value = get_field(changeset, :value)
    date = get_field(changeset, :date)
    year = date.year

    if value == to_string(year) do
      changeset
    else
      add_error(changeset, :value, "must match the year of the date field")
    end
  end

  defp get_quarter(date) do
    case date.month do
      month when month in [1, 2, 3] -> "Q1"
      month when month in [4, 5, 6] -> "Q2"
      month when month in [7, 8, 9] -> "Q3"
      month when month in [10, 11, 12] -> "Q4"
    end
  end

  def valid_types, do: @valid_types
end
