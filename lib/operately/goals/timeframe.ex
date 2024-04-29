defmodule Operately.Goals.Timeframe do
  use Operately.Schema

  schema "timeframes" do
    field :type, :string
    field :start_date, :date
    field :end_date, :date
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(timeframe, attrs) do
    timeframe
    |> cast(attrs, [:type, :start_date, :end_date])
    |> validate_required([:type, :start_date, :end_date])
    |> validate_inclusion(:type, ["year", "quarter", "month", "days"])
    |> validate_start_is_before_end()
    |> validate_year_dates()
    |> validate_quarter_dates()
    |> validate_month_dates()
  end

  def validate_start_is_before_end(changeset) do
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    if Date.compare(start_date, end_date) != :lt do
      add_error(changeset, :end_date, "End date must be after start date")
    else
      changeset
    end
  end

  def validate_year_dates(changeset) do
    type = get_field(changeset, :type)
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    if type == "year" do
      cond do
        start_date.month != 1 or start_date.day != 1 ->
          add_error(changeset, :start_date, "Start date must be the first day of the year")

        end_date.month != 12 or end_date.day != 31 ->
          add_error(changeset, :end_date, "End date must be the last day of the year")

        end_date.year - start_date.year != 0 ->
          add_error(changeset, :end_date, "Start and end date must be in the same year")

        true -> changeset
      end
    else
      changeset
    end
  end

  def validate_quarter_dates(changeset) do
    type = get_field(changeset, :type)
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    if type == "quarter" do
      cond do
        start_date.year != end_date.year ->
          add_error(changeset, :end_date, "Start and end date must be in the same year")

        start_date.month not in [1, 4, 7, 10] or start_date.day != 1 ->
          add_error(changeset, :start_date, "Start date must be the first day of the quarter")

        end_date.month not in [3, 6, 9, 12] or end_date.day != Date.days_in_month(end_date) ->
          add_error(changeset, :end_date, "End date must be the last day of the quarter")

        end_date.month - start_date.month != 2 ->
          add_error(changeset, :end_date, "Start and end date must be in the same quarter")

        true -> changeset
      end
    else
      changeset
    end
  end

  def validate_month_dates(changeset) do
    type = get_field(changeset, :type)
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    if type == "month" do
      cond do
        start_date.year != end_date.year ->
          add_error(changeset, :end_date, "Start and end date must be in the same year")

        start_date.day != 1 ->
          add_error(changeset, :start_date, "Start date must be the first day of the month")

        end_date.day != Date.days_in_month(end_date) ->
          add_error(changeset, :end_date, "End date must be the last day of the month")

        true -> changeset
      end
    else
      changeset
    end
  end
end
