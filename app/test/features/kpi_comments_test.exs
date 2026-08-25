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
  end
end
