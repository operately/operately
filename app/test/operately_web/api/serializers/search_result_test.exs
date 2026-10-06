defmodule OperatelyWeb.Api.Serializers.SearchResultTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Result
  alias OperatelyWeb.Api.Serializer

  test "translates system titles at serialization without changing the search record" do
    for type <- [:goal_check_in, :project_check_in] do
      result = result(type, "Check-in on 2026-10-05")
      assert localized(result, "pt_BR").title == "Check-in em 2026-10-05"
      assert localized(result, "en").title == result.title
      assert localized(result, "fr").title == result.title
      assert result.title == "Check-in on 2026-10-05"
      assert localized(result, "pt_BR").type == type
    end

    assert localized(result(:project_retrospective, "Project retrospective"), "pt_BR").title == "Retrospectiva de projeto"
  end

  test "preserves user titles and content even when they match system copy" do
    result = %{result(:task, "Project retrospective") | snippet: "Check-in on 2026-10-05", context: "<My company>"}
    serialized = localized(result, "pt_BR")
    assert serialized.title == result.title
    assert serialized.snippet == result.snippet
    assert serialized.context == result.context
    assert localized(result(:goal_check_in, "Legacy title"), "pt_BR").title == "Legacy title"
  end

  defp localized(result, locale), do: Gettext.with_locale(OperatelyWeb.Gettext, locale, fn -> Serializer.serialize(result, level: :essential) end)

  defp result(type, title) do
    %Result{id: Ecto.UUID.generate(), type: type, title: title, context: "Project", matched_field: :title, navigation_target: %{}, inserted_at: ~U[2026-10-05 12:00:00Z]}
  end
end
