defmodule Operately.Goals.TimeframeTest do
  use Operately.DataCase

  alias Operately.Goals.Timeframe

  test "changeset/1 with valid data returns no errors" do
    changeset = Timeframe.changeset(%{type: "year", start_date: ~D[2020-01-01], end_date: ~D[2020-12-31]})
    assert changeset.valid?

    changeset = Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-01-01], end_date: ~D[2020-03-31]})
    assert changeset.valid?

    changeset = Timeframe.changeset(%{type: "month", start_date: ~D[2020-01-01], end_date: ~D[2020-01-31]})
    assert changeset.valid?

    changeset = Timeframe.changeset(%{type: "days", start_date: ~D[2020-01-15], end_date: ~D[2020-01-20]})
    assert changeset.valid?
  end

  test "changeset/1 validates type" do
    assert Timeframe.changeset(%{type: "invalid", start_date: ~D[2020-01-01], end_date: ~D[2020-12-31]}).valid? == false
  end

  test "changeset/1 validates start date is before end date" do
    assert Timeframe.changeset(%{type: "days", start_date: ~D[2021-01-01], end_date: ~D[2020-12-31]}).valid? == false
  end

  test "changeset/1 validates year dates" do
    assert Timeframe.changeset(%{type: "year", start_date: ~D[2020-01-02], end_date: ~D[2020-12-31]}).valid? == false
    assert Timeframe.changeset(%{type: "year", start_date: ~D[2020-01-01], end_date: ~D[2021-12-31]}).valid? == false
    assert Timeframe.changeset(%{type: "year", start_date: ~D[2020-01-01], end_date: ~D[2020-12-30]}).valid? == false
  end

  test "changeset/1 validates quarter dates" do
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-01-01], end_date: ~D[2020-03-31]}).valid? == true
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-04-01], end_date: ~D[2020-06-30]}).valid? == true
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-07-01], end_date: ~D[2020-09-30]}).valid? == true
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-10-01], end_date: ~D[2020-12-31]}).valid? == true

    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-01-01], end_date: ~D[2020-12-31]}).valid? == false
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-01-01], end_date: ~D[2020-03-30]}).valid? == false
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-02-01], end_date: ~D[2020-04-30]}).valid? == false
    assert Timeframe.changeset(%{type: "quarter", start_date: ~D[2020-01-01], end_date: ~D[2021-03-31]}).valid? == false
  end

  test "changeset/1 validates month dates" do
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-01-01], end_date: ~D[2020-01-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-02-01], end_date: ~D[2020-02-29]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-03-01], end_date: ~D[2020-03-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-04-01], end_date: ~D[2020-04-30]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-05-01], end_date: ~D[2020-05-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-06-01], end_date: ~D[2020-06-30]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-07-01], end_date: ~D[2020-07-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-08-01], end_date: ~D[2020-08-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-09-01], end_date: ~D[2020-09-30]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-10-01], end_date: ~D[2020-10-31]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-11-01], end_date: ~D[2020-11-30]}).valid? == true
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-12-01], end_date: ~D[2020-12-31]}).valid? == true

    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-01-01], end_date: ~D[2020-01-30]}).valid? == false
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-01-01], end_date: ~D[2021-01-31]}).valid? == false
    assert Timeframe.changeset(%{type: "month", start_date: ~D[2020-01-01], end_date: ~D[2021-01-21]}).valid? == false
  end
end
