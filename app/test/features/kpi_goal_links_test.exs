defmodule Operately.Features.KpiGoalLinksTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.KpiGoalLinksSteps, as: Steps

  feature "manage a cross-space link from either detail page", ctx do
    ctx
    |> Steps.setup()
    |> Steps.visit_goal()
    |> Steps.link_kpi()
    |> Steps.visit_linked_kpi()
    |> Steps.unlink_goal()
    |> Steps.link_goal()
    |> Steps.visit_linked_goal()
    |> Steps.unlink_kpi()
  end
end
