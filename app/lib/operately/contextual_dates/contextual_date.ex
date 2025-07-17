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
    valid_months = ~w(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec)

    if value in valid_months do
      changeset
    else
      add_error(changeset, :value, "must be a valid month abbreviation (Jan, Feb, etc.)")
    end
  end

  defp validate_value_format(changeset, :quarter) do
    value = get_field(changeset, :value)
    valid_quarters = ~w(Q1 Q2 Q3 Q4)

    if value in valid_quarters do
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

  def valid_types, do: @valid_types
end
