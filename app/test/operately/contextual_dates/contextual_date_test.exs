defmodule Operately.ContextualDates.ContextualDateTest do
  use Operately.DataCase, async: true

  alias Operately.ContextualDates.ContextualDate

  describe "changeset/2" do
    test "validates with valid data" do
      params = %{
        date_type: :day,
        value: "2025-07-15",
        date: ~D[2025-07-15]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert changeset.valid?
    end
  end

  describe "validate_value_format/2 for day type" do
    test "validates when value matches ISO format of date" do
      params = %{
        date_type: :day,
        value: "2025-07-15",
        date: ~D[2025-07-15]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert changeset.valid?
    end
  end

  describe "validate_value_format/2 for month type" do
    test "validates with valid month abbreviation" do
      params = %{
        date_type: :month,
        value: "Jul 2025",
        date: ~D[2025-07-31]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert changeset.valid?
    end

    test "returns error with invalid month abbreviation" do
      params = %{
        date_type: :month,
        value: "Invalid",
        date: ~D[2025-07-31]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert %{value: ["must be in 'Month Year' format (e.g., 'Jul 2025')"]} = errors_on(changeset)
    end
  end

  describe "validate_value_format/2 for quarter type" do
    test "validates with valid quarter format" do
      params = %{
        date_type: :quarter,
        value: "Q3 2025",
        date: ~D[2025-09-30]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert changeset.valid?
    end

    test "returns error with invalid quarter format" do
      params = %{
        date_type: :quarter,
        value: "Quarter 3",
        date: ~D[2025-09-30]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert %{value: ["must be a valid quarter format (Q1, Q2, Q3, Q4)"]} = errors_on(changeset)
    end
  end

  describe "validate_value_format/2 for year type" do
    test "validates when value matches year of date" do
      params = %{
        date_type: :year,
        value: "2025",
        date: ~D[2025-12-31]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert changeset.valid?
    end

    test "returns error when value doesn't match year of date" do
      params = %{
        date_type: :year,
        value: "2026",
        date: ~D[2025-12-31]
      }

      changeset = ContextualDate.changeset(%ContextualDate{}, params)
      assert %{value: ["must match the year of the date field"]} = errors_on(changeset)
    end
  end
end
