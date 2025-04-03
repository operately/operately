defmodule Operately.Assignments.FilterLateAssignmentsTest do
  use Operately.DataCase

  alias Operately.Assignments.FilterLateAssignments, as: Filter

  describe "business_days_between/2" do
    test "same date returns 0" do
      date = ~D[2024-12-10]
      assert Filter.business_days_between(date, date) == 0
    end

    test "consecutive business days - Mon -> Tue" do
      assert Filter.business_days_between(~D[2024-12-09], ~D[2024-12-10]) == 1
    end

    test "spanning weekend - Fri -> Mon" do
      assert Filter.business_days_between(~D[2024-12-06], ~D[2024-12-09]) == 1
    end

    test "2 full weeks" do
      assert Filter.business_days_between(~D[2024-12-02], ~D[2024-12-13]) == 9
    end

    test "later dates return 0" do
      assert Filter.business_days_between(~D[2024-12-11], ~D[2024-12-10]) == 0
    end

    test "start on weekend - Sat -> Tue" do
      assert Filter.business_days_between(~D[2024-12-07], ~D[2024-12-10]) == 2
    end

    test "month boundary - Dec -> Jan" do
      assert Filter.business_days_between(~D[2024-12-30], ~D[2025-01-02]) == 3
    end

    test "longer month boundary - Dec -> Jan" do
      assert Filter.business_days_between(~D[2024-12-23], ~D[2025-01-03]) == 9
    end
  end
end
