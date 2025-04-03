defmodule Operately.TimeTest do
  use Operately.DataCase, async: true

  alias Operately.Time

  describe "calculate_next_weekly_check_in" do
    @due ~D[2020-01-03] # this is a Friday

    test "had no previous due date -> schedule next check-in for next Friday" do
      assert Time.calculate_next_weekly_check_in(nil, ~D[2020-01-03]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in on time -> schedule next check-in for next Friday" do
      assert Time.calculate_next_weekly_check_in(@due, ~D[2020-01-03]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in on before due date -> schedule next check-in for next Friday" do
      assert Time.calculate_next_weekly_check_in(@due, ~D[2020-01-02]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in on significantly before due date, more than a week -> don't change the next check-in" do
      assert Time.calculate_next_weekly_check_in(@due, ~D[2019-12-22]) == Time.as_datetime(@due)
    end

    test "check in late -> schedule next check-in for next Friday" do
      assert Time.calculate_next_weekly_check_in(@due, ~D[2020-01-04]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in significantly late -> schedule next check-in for next Friday" do
      assert Time.calculate_next_weekly_check_in(@due, ~D[2020-01-20]) == Time.as_datetime(~D[2020-01-24])
    end
  end

  describe "calculate_next_montly_check_in" do
    test "had no previous due date -> schedule next check-in for next month" do
      assert Time.calculate_next_monthly_check_in(nil, ~D[2020-02-01]) == Time.as_datetime(~D[2020-03-01])
    end

    test "check in on time -> schedule first of next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-02-01]) == Time.as_datetime(~D[2020-03-01])
    end

    test "check in on before due date -> schedule next check-in for first of next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-01-31]) == Time.as_datetime(~D[2020-03-01])
    end

    test "check in on significantly before due date, more than a week -> don't change the next check-in" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-01-15]) == Time.as_datetime(~D[2020-02-01])
    end

    test "check in late -> schedule next check-in for first of next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-02-02]) == Time.as_datetime(~D[2020-03-01])
    end

    test "check in significantly late -> schedule next check-in for first of next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-03-20]) == Time.as_datetime(~D[2020-04-01])
    end
  end
end
