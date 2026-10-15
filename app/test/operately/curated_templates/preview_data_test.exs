defmodule Operately.CuratedTemplates.PreviewDataTest do
  use ExUnit.Case, async: true
  alias Operately.CuratedTemplates.PreviewData

  test "empty preview data is valid for existing templates" do
    for type <- [:kpi, :goal, :project], do: assert({:ok, %{}} = PreviewData.validate(type, %{}))
  end

  test "normalizes relative reporting periods and rejects duplicate periods" do
    preview = %{"entries" => [%{"period_offset" => "-2", "value" => "12.5"}], "annotations" => [%{"period_offset" => -1, "title" => "Campaign"}]}
    assert {:ok, normalized} = PreviewData.validate(:kpi, preview)
    assert normalized["entries"] == [%{"period_offset" => -2, "value" => 12.5}]
    assert normalized["annotations"] == preview["annotations"]

    duplicate = %{preview | "entries" => [%{"period_offset" => -1, "value" => 1}, %{"period_offset" => -1, "value" => 2}]}
    assert {:error, _} = PreviewData.validate(:kpi, duplicate)

    for offset <- [nil, "", "invalid", 1.5] do
      assert {:error, _} = PreviewData.validate(:kpi, %{"entries" => [%{"period_offset" => offset, "value" => 10}]})
    end
  end

  test "rejects incomplete, invalid, excessive, and unknown sample data" do
    for preview <- [
          nil,
          %{"unexpected" => true},
          %{"entries" => [%{"date" => "2026-09-30", "period_offset" => -1, "value" => 12}]},
          %{"entries" => [%{"date" => "2026-09-30", "value" => 12}]},
          %{"annotations" => [%{"date" => "2026-09-01", "title" => "Campaign"}]},
          %{"entries" => [%{"period_offset" => -1}]},
          %{"entries" => [%{"period_offset" => -1, "value" => "invalid"}]},
          %{"entries" => [%{"period_offset" => -1, "value" => 12, "person_id" => "private"}]},
          %{"entries" => List.duplicate(%{"period_offset" => -1, "value" => 12}, 201)},
          %{"annotations" => [%{"period_offset" => -1, "title" => ""}]}
        ] do
      assert {:error, errors} = PreviewData.validate(:kpi, preview)
      assert errors != []
    end
  end

end
