defmodule Operately.Features.KpiCommentsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.KpiCommentsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "comment on a KPI update", ctx do
    ctx
    |> Steps.visit_kpi_page()
    |> Steps.open_update_comments()
    |> Steps.leave_comment()
    |> Steps.assert_comment_visible()
    |> Steps.assert_update_comment_count(1)
  end

  feature "log an update with a note", ctx do
    ctx
    |> Steps.visit_kpi_page()
    |> Steps.log_update(value: "456", note: "Enterprise renewals landed early.")
    |> Steps.assert_note_is_first_comment_on_latest_update(note: "Enterprise renewals landed early.")
  end
end
