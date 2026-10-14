defmodule Operately.CuratedTemplates.PreviewDataTest do
  use ExUnit.Case, async: true
  alias Operately.CuratedTemplates.PreviewData

  test "empty preview data is valid for existing templates" do
    for type <- [:kpi, :goal, :project], do: assert({:ok, %{}} = PreviewData.validate(type, %{}, %{}))
  end

  test "normalizes KPI dates and values and preserves annotation text" do
    preview = %{"entries" => [%{"date" => "2026-09-30", "value" => "12.5"}], "annotations" => [%{"date" => "2026-09-01", "title" => "Campaign"}]}
    assert {:ok, normalized} = PreviewData.validate(:kpi, preview, %{"cadence" => "monthly"})
    assert normalized["entries"] == [%{"date" => "2026-09-30", "value" => 12.5}]
    assert normalized["annotations"] == preview["annotations"]
  end

  test "rejects incomplete, invalid, excessive, and unknown sample data" do
    for preview <- [
          nil,
          %{"unexpected" => true},
          %{"entries" => [%{"date" => "not-a-date", "value" => 12}]},
          %{"entries" => [%{"date" => "2026-02-30", "value" => 12}]},
          %{"entries" => [%{"date" => "2026-09-30"}]},
          %{"entries" => [%{"date" => "2026-09-30", "value" => "invalid"}]},
          %{"entries" => [%{"date" => "2026-09-30", "value" => 12, "person_id" => "private"}]},
          %{"entries" => List.duplicate(%{"date" => "2026-09-30", "value" => 12}, 201)},
          %{"annotations" => [%{"date" => "2026-09-01", "title" => ""}]}
        ] do
      assert {:error, errors} = PreviewData.validate(:kpi, preview, %{})
      assert errors != []
    end
  end

  test "allows one measurement per reporting period" do
    preview = %{"entries" => [%{"date" => "2026-09-01", "value" => 10}, %{"date" => "2026-09-30", "value" => 12}]}
    assert {:error, _} = PreviewData.validate(:kpi, preview, %{"cadence" => "monthly"})
    assert {:ok, _} = PreviewData.validate(:kpi, preview, %{"cadence" => "weekly"})
  end
end
