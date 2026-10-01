defmodule OperatelyEmail.CheckInOverviewTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.CheckInOverview

  test "keeps complete English status sentences and their emphasis" do
    doc = CheckInOverview.construct(:goal, :on_track, nil, nil)
    html = doc |> OperatelyEmail.Templates.rich_text() |> Phoenix.HTML.safe_to_string()
    assert html =~ "The goal is "
    assert html =~ "on-track"
    assert html =~ " and progressing as planned."
    assert html =~ "background-color: #bbf7d0"
  end

  test "uses Portuguese sentences, preserves literal names, and handles due today" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      doc = CheckInOverview.construct(:project, :caution, %{full_name: "<Ana> Silva"}, Date.utc_today())
      text = Operately.RichContent.rich_content_to_string(doc)
      assert text =~ "O projeto"
      assert text =~ "precisa de atenção"
      assert text =~ "<Ana> deve ficar ciente."
      assert text =~ "vence hoje."
    end)
  end

  test "pluralizes overdue and future durations without losing the deadline" do
    for {days, expected} <- [{-1, "1 dia de atraso."}, {-3, "3 dias de atraso."}, {1, "1 dia até o prazo."}, {14, "2 semanas até o prazo."}, {60, "2 meses até o prazo."}] do
      text =
        Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
          CheckInOverview.construct(:goal, :off_track, nil, Date.add(Date.utc_today(), days))
          |> Operately.RichContent.rich_content_to_string()
          |> String.replace(~r/\s+/u, " ")
        end)

      assert text =~ expected
    end
  end
end
