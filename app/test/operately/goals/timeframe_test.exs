defmodule Operately.Goals.TimeframeTest do
  use Operately.DataCase

  alias Operately.ContextualDates.Timeframe
  alias Operately.ContextualDates.ContextualDate

  test "changeset/1 with valid data returns no errors" do
    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_year_date(~D[2020-01-01]),
        contextual_end_date: ContextualDate.create_year_date(~D[2020-12-31])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_quarter_date(~D[2020-01-01]),
        contextual_end_date: ContextualDate.create_quarter_date(~D[2020-03-31])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_month_date(~D[2020-01-01]),
        contextual_end_date: ContextualDate.create_month_date(~D[2020-01-31])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: %ContextualDate{date_type: :day, value: "15 Jan 2020", date: ~D[2020-01-15]},
        contextual_end_date: %ContextualDate{date_type: :day, value: "20 Jan 2020", date: ~D[2020-01-20]}
      })

    assert changeset.valid?
  end

  test "changeset/1 validates date types" do
    invalid_contextual_date = %ContextualDate{date_type: :invalid, value: "2020", date: ~D[2020-01-01]}

    assert_raise FunctionClauseError, fn ->
      Timeframe.changeset(%{
        contextual_start_date: invalid_contextual_date,
        contextual_end_date: ContextualDate.create_year_date(~D[2020-12-31])
      })
    end
  end

  test "contextual dates validation for years" do
    # Wrong value format for year
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :year,
        # Should be "2020"
        value: "wrong",
        date: ~D[2020-01-01]
      })

    refute changeset.valid?

    # Valid year date
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :year,
        value: "2020",
        date: ~D[2020-01-01]
      })

    assert changeset.valid?
  end

  test "valid timeframes with quarter dates" do
    # Valid quarters
    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_quarter_date(~D[2020-01-01]),
        contextual_end_date: ContextualDate.create_quarter_date(~D[2020-03-31])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_quarter_date(~D[2020-04-01]),
        contextual_end_date: ContextualDate.create_quarter_date(~D[2020-06-30])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_quarter_date(~D[2020-07-01]),
        contextual_end_date: ContextualDate.create_quarter_date(~D[2020-09-30])
      })

    assert changeset.valid?

    changeset =
      Timeframe.changeset(%{
        contextual_start_date: ContextualDate.create_quarter_date(~D[2020-10-01]),
        contextual_end_date: ContextualDate.create_quarter_date(~D[2020-12-31])
      })

    assert changeset.valid?
  end

  test "contextual dates validation for quarters" do
    # Wrong value format for Q1
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :quarter,
        # Should be "Q1 2020"
        value: "Wrong Format",
        date: ~D[2020-01-01]
      })

    refute changeset.valid?

    # Valid quarter date
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :quarter,
        value: "Q1 2020",
        date: ~D[2020-01-01]
      })

    assert changeset.valid?
  end

  test "valid timeframes with month dates" do
    assert Timeframe.changeset(%{
             contextual_start_date: ContextualDate.create_month_date(~D[2020-01-01]),
             contextual_end_date: ContextualDate.create_month_date(~D[2020-01-31])
           }).valid?

    assert Timeframe.changeset(%{
             contextual_start_date: ContextualDate.create_month_date(~D[2020-02-01]),
             contextual_end_date: ContextualDate.create_month_date(~D[2020-02-29])
           }).valid?
  end

  test "contextual dates validation for months" do
    # Wrong value format for month
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :month,
        # Should be "Jan 2020"
        value: "Wrong Format",
        date: ~D[2020-01-01]
      })

    refute changeset.valid?

    # Valid month date
    changeset =
      ContextualDate.changeset(%ContextualDate{}, %{
        date_type: :month,
        value: "Jan 2020",
        date: ~D[2020-01-01]
      })

    assert changeset.valid?
  end

  test "can be constructed from a Timeframe struct" do
    timeframe = %Timeframe{
      contextual_start_date: ContextualDate.create_year_date(~D[2020-01-01]),
      contextual_end_date: ContextualDate.create_year_date(~D[2020-12-31])
    }

    assert Timeframe.changeset(timeframe)
  end
end
