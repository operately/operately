defmodule Operately.Features.KpiEntriesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.KpiEntriesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "edit a logged KPI update and see the previous value", ctx do
    ctx
    |> Steps.visit_kpi_page()
    |> Steps.edit_latest_update(value: "50")
    |> Steps.assert_latest_value("50")
    |> Steps.assert_previous_value_visible("42")
  end

  feature "delete a logged KPI update", ctx do
    ctx
    |> Steps.visit_kpi_page()
    |> Steps.delete_latest_update()
    |> Steps.assert_update_deleted()
  end
end
