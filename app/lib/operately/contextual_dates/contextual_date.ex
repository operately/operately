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

  #
  # Validation
  #

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

  #
  # Helpers
  #

  defp get_quarter(date) do
    case date.month do
      month when month in [1, 2, 3] -> "Q1"
      month when month in [4, 5, 6] -> "Q2"
      month when month in [7, 8, 9] -> "Q3"
      month when month in [10, 11, 12] -> "Q4"
    end
  end

  def valid_types, do: @valid_types

  def create_year_date(date) do
    year = date.year
    %__MODULE__{
      date_type: :year,
      value: to_string(year),
      date: date
    }
  end

  def create_quarter_date(date) do
    %__MODULE__{
      date_type: :quarter,
      value: "#{get_quarter(date)} #{date.year}",
      date: date
    }
  end

  def create_month_date(date) do
    %__MODULE__{
      date_type: :month,
      value: Calendar.strftime(date, "%b %Y"),
      date: date
    }
  end

  def create_day_date(date) do
    %__MODULE__{
      date_type: :day,
      value: Calendar.strftime(date, "%b %-d, %Y"),
      date: date
    }
  end

  def create_date(date, type) when type in @valid_types do
    case type do
      :year -> create_year_date(date)
      :quarter -> create_quarter_date(date)
      :month -> create_month_date(date)
      :day -> create_day_date(date)
    end
  end

  def from_string(string_date, type) when type in @valid_types do
    date = Date.from_iso8601!(string_date)
    create_date(date, type)
  end

  def parse_json(nil), do: nil

  def parse_json(json) when is_binary(json) do
    parse_json(Jason.decode!(json))
  end

  def parse_json(map) do
    %{"date" => date, "date_type" => type, "value" => value} = map

    %__MODULE__{
      date: Date.from_iso8601!(date),
      date_type: String.to_existing_atom(type),
      value: value
    }
  end

  def get_date(nil), do: nil
  def get_date(date = %__MODULE__{}), do: date.date
end
