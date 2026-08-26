defmodule Operately.Assignments.KpiScheduleTest do
  use ExUnit.Case, async: true

  alias Operately.Assignments.KpiSchedule

  describe "current_period/2" do
    test "returns the Monday through Sunday period for weekly KPIs" do
      assert KpiSchedule.current_period(:weekly, ~D[2026-08-26]) == {
               ~D[2026-08-24],
               ~D[2026-08-30]
             }
    end

    test "returns the calendar month for monthly KPIs" do
      assert KpiSchedule.current_period(:monthly, ~D[2026-08-26]) == {
               ~D[2026-08-01],
               ~D[2026-08-31]
             }
    end
  end
end
