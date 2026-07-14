defmodule Operately.SchedulingTest do
  use ExUnit.Case, async: true

  test "accepts a future scheduled time" do
    assert :ok = Operately.Scheduling.validate_scheduled_at(DateTime.add(DateTime.utc_now(), 1, :hour))
  end

  test "accepts nil when no scheduling change is requested" do
    assert :ok = Operately.Scheduling.validate_scheduled_at(nil)
  end

  test "rejects a scheduled time in the past" do
    assert {:error, :scheduled_at_must_be_in_the_future} =
             Operately.Scheduling.validate_scheduled_at(DateTime.add(DateTime.utc_now(), -1, :second))
  end

  test "rejects the current scheduled time" do
    now = Operately.Time.utc_datetime_now()

    assert {:error, :scheduled_at_must_be_in_the_future} = Operately.Scheduling.validate_scheduled_at(now)
  end
end
