defmodule Operately.TimeTest do
  use Operately.DataCase, async: true

  alias Operately.Time

  describe "calculate_next_check_in" do
    @due ~D[2020-01-03] # this is a Friday

    test "check in on time" do
      assert Time.calculate_next_check_in(@due, ~D[2020-01-03]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in on before due date" do
      assert Time.calculate_next_check_in(@due, ~D[2020-01-01]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in on significantly before due date" do
      assert Time.calculate_next_check_in(@due, ~D[2020-01-01]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in late" do
      assert Time.calculate_next_check_in(@due, ~D[2020-01-04]) == Time.as_datetime(~D[2020-01-10])
    end

    test "check in significantly late" do
      assert Time.calculate_next_check_in(@due, ~D[2020-01-20]) == Time.as_datetime(~D[2020-01-24])
    end
  end

  describe "calculate_next_montly_check_in" do
    test "if you check-in after the due date, it will set the next check-in to the next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-02-10]) == Time.as_datetime(~D[2020-03-01])
    end

    test "if you check-in more than a week before the due date, it will keep the next check-in to the same month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-01-15]) == Time.as_datetime(~D[2020-02-01])
    end

    test "if you check-in in the one week window before the due date, it will move the next check-in to the next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-01-27]) == Time.as_datetime(~D[2020-03-01])
    end

    test "if you check-in after several months after the due date, it will set the next check-in to the next month" do
      assert Time.calculate_next_monthly_check_in(~D[2020-02-01], ~D[2020-03-17]) == Time.as_datetime(~D[2020-04-01])
    end
  end
end
