defmodule Operately.Goals.TargetTest do
  use Operately.DataCase

  alias Operately.Goals.Target

  describe "format_value/1" do
    test "formats integer values with units" do
      target = %Target{value: 42, unit: "points"}
      assert Target.format_value(target) == "42 points"
    end

    test "formats float values with two decimal places" do
      target = %Target{value: 42.123, unit: "kg"}
      assert Target.format_value(target) == "42.12 kg"
    end

    test "formats percentage values correctly" do
      target = %Target{value: 75.5, unit: "%"}
      assert Target.format_value(target) == "75.5%"
    end

    test "handles zero values" do
      target = %Target{value: 0, unit: "units"}
      assert Target.format_value(target) == "0 units"
    end

    test "handles negative values" do
      target = %Target{value: -10.5, unit: "points"}
      assert Target.format_value(target) == "-10.5 points"
    end

    test "formats float values without decimal places as integers" do
      target = %Target{value: 21.0, unit: "points"}
      assert Target.format_value(target) == "21 points"
    end
  end

  describe "target_progress_percentage/1" do
    test "ascending targets (from < to)" do
      # 0% progress at start
      target = %Target{from: 0, to: 100, value: 0}
      assert Target.target_progress_percentage(target) == 0.0

      # 100% progress at target
      target = %Target{from: 0, to: 100, value: 100}
      assert Target.target_progress_percentage(target) == 100.0

      # 50% progress at halfway
      target = %Target{from: 0, to: 100, value: 50}
      assert Target.target_progress_percentage(target) == 50.0
    end

    test "descending targets (from > to)" do
      # 0% progress at start (high value)
      target = %Target{from: 100, to: 0, value: 100}
      assert Target.target_progress_percentage(target) == 0.0

      # 100% progress at target (low value)
      target = %Target{from: 100, to: 0, value: 0}
      assert Target.target_progress_percentage(target) == 100.0

      # 50% progress at halfway
      target = %Target{from: 100, to: 0, value: 50}
      assert Target.target_progress_percentage(target) == 50.0
    end

    test "equal targets (from == to) return 0% progress" do
      # Zero to zero
      target = %Target{from: 0, to: 0, value: 0}
      assert Target.target_progress_percentage(target) == 0

      # Positive equal values
      target = %Target{from: 100, to: 100, value: 100}
      assert Target.target_progress_percentage(target) == 0

      # Negative equal values
      target = %Target{from: -50, to: -50, value: -50}
      assert Target.target_progress_percentage(target) == 0

      # Equal targets with different current values
      target = %Target{from: 10, to: 10, value: 5}
      assert Target.target_progress_percentage(target) == 0

      target = %Target{from: 10, to: 10, value: 15}
      assert Target.target_progress_percentage(target) == 0
    end
  end
end
