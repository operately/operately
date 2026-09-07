defmodule Operately.Support.Features.KpiEntriesSteps do
  use Operately.FeatureCase

  import Operately.KpisFixtures

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("space_kpis")
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi, value: 42.0, period: ~D[2026-01-15])

    Map.merge(ctx, %{kpi: kpi, entry: entry})
  end

  step :visit_kpi_page, ctx do
    UI.visit(ctx, Paths.space_kpi_path(ctx.company, ctx.space, ctx.kpi))
  end

  step :edit_latest_update, ctx, opts do
    ctx
    |> UI.assert_has(testid: "kpi-detail")
    |> UI.click(testid: "entry-menu-#{Paths.kpi_entry_id(ctx.entry)}")
    |> UI.click(testid: "edit-entry-#{Paths.kpi_entry_id(ctx.entry)}")
    |> UI.assert_has(testid: "edit-entry-modal")
    |> UI.fill(testid: "value", with: opts[:value])
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "edit-entry-modal")
  end

  step :assert_latest_value, ctx, value do
    UI.assert_text(ctx, value, testid: "kpi-current-value")
  end

  step :assert_previous_value_visible, ctx, previous do
    ctx
    |> UI.click(testid: "entry-edited-#{Paths.kpi_entry_id(ctx.entry)}")
    |> UI.assert_text(previous, testid: "entry-edit-history-#{Paths.kpi_entry_id(ctx.entry)}")
  end
end
