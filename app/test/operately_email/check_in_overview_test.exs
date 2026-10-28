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
      assert text =~ "A data de conclusão é hoje."
    end)
  end

  test "uses due date terminology for singular and plural future durations" do
    for resource <- [:goal, :project],
        {days, expected} <- [{1, "1 day"}, {2, "2 days"}, {7, "1 week"}, {14, "2 weeks"}, {30, "1 month"}, {60, "2 months"}] do
      doc = CheckInOverview.construct(resource, :on_track, nil, Date.add(Date.utc_today(), days))
      text = Operately.RichContent.rich_content_to_string(doc)
      html = doc |> OperatelyEmail.Templates.rich_text() |> Phoenix.HTML.safe_to_string()

      assert text =~ "#{expected} until the due date."
      assert html =~ "#{expected} until the due date."
    end
  end

  test "pluralizes overdue and future durations using the Portuguese due date glossary" do
    for {days, expected} <- [
          {-1, "1 dia de atraso."},
          {-3, "3 dias de atraso."},
          {1, "1 dia até a data de conclusão."},
          {14, "2 semanas até a data de conclusão."},
          {60, "2 meses até a data de conclusão."}
        ] do
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
