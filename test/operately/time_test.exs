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
end
