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
end
