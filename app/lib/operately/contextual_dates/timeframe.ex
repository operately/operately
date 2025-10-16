defmodule Operately.ContextualDates.Timeframe do
  use Ecto.Schema
  import Ecto.Changeset

  alias Operately.ContextualDates.ContextualDate

  @derive {Jason.Encoder, only: [:contextual_start_date, :contextual_end_date]}

  def fetch(term, key) when is_atom(key) do
    {:ok, Map.get(term, key)}
  end

  def fetch(term, key) when is_binary(key) do
    {:ok, Map.get(term, String.to_existing_atom(key))}
  end

  embedded_schema do
    embeds_one :contextual_start_date, ContextualDate
    embeds_one :contextual_end_date, ContextualDate

    #
    # Deprecated:
    # It should be removed once we are sure that all the migrations have run
    field :type, :string
    field :start_date, :date
    field :end_date, :date
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(timeframe, attrs) when is_struct(attrs, __MODULE__) do
    changeset(timeframe, Map.from_struct(attrs))
  end

  def changeset(timeframe, attrs) do
    timeframe
    |> cast(attrs, [:type, :start_date, :end_date])
    |> cast_embed(:contextual_start_date)
    |> cast_embed(:contextual_end_date)
  end

  def current_year do
    Date.utc_today()
    |> year_timeframe()
  end

  def last_year do
    Date.utc_today()
    |> Date.add(-365)
    |> year_timeframe()
  end

  def year_timeframe(date) do
    %__MODULE__{
      contextual_start_date: ContextualDate.create_year_date(beginning_of_year(date)),
      contextual_end_date: ContextualDate.create_year_date(end_of_year(date))
    }
  end

  def current_quarter(:as_map), do: current_quarter() |> Map.from_struct()

  def current_quarter do
    today = Date.utc_today()
    year = today.year

    cond do
      today.month in 1..3 -> quarter_timeframe(year, "01-01", "03-31")
      today.month in 4..6 -> quarter_timeframe(year, "04-01", "06-30")
      today.month in 7..9 -> quarter_timeframe(year, "07-01", "09-30")
      today.month in 10..12 -> quarter_timeframe(year, "10-01", "12-31")
    end
  end

  def next_quarter(:as_map), do: next_quarter() |> Map.from_struct()

  def next_quarter do
    today = Date.utc_today()
    year = today.year

    cond do
      today.month in 1..3 -> quarter_timeframe(year, "04-01", "06-30")
      today.month in 4..6 -> quarter_timeframe(year, "07-01", "09-30")
      today.month in 7..9 -> quarter_timeframe(year, "10-01", "12-31")
      today.month in 10..12 -> quarter_timeframe(year + 1, "01-01", "03-31")
    end
  end

  def parse_json!(json) when is_binary(json) do
    parse_json!(Jason.decode!(json))
  end

  def parse_json!(map) do
    %__MODULE__{
      contextual_start_date: ContextualDate.parse_json(map["contextual_start_date"]),
      contextual_end_date: ContextualDate.parse_json(map["contextual_end_date"])
    }
  end

  defp beginning_of_year(date) do
    {year, _, _} = Date.to_erl(date)
    Date.from_erl!({year, 1, 1})
  end

  defp end_of_year(date) do
    {year, _, _} = Date.to_erl(date)
    Date.from_erl!({year, 12, 31})
  end

  defp quarter_timeframe(year, start_date_str, end_date_str) do
    start_date = Date.from_iso8601!("#{year}-#{start_date_str}")
    end_date = Date.from_iso8601!("#{year}-#{end_date_str}")

    %__MODULE__{
      contextual_start_date: ContextualDate.create_quarter_date(start_date),
      contextual_end_date: ContextualDate.create_quarter_date(end_date)
    }
  end

  def start_date(nil), do: nil
  def start_date(%__MODULE__{contextual_start_date: nil}), do: nil
  def start_date(%__MODULE__{contextual_start_date: contextual_date}), do: contextual_date.date

  def end_date(nil), do: nil
  def end_date(%__MODULE__{contextual_end_date: nil}), do: nil
  def end_date(%__MODULE__{contextual_end_date: contextual_date}), do: contextual_date.date
end
