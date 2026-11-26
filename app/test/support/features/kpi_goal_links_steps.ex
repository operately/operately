defmodule Operately.Support.Features.KpiGoalLinksSteps do
  use Operately.FeatureCase
  import Operately.KpisFixtures

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:metrics)
      |> Factory.add_space(:planning)
      |> Factory.add_goal(:goal, :planning)
      |> Factory.add_space_member(:editor, :metrics)
      |> Factory.enable_feature("work_map_v2")
      |> Factory.log_in_person(:editor)

    Map.put(ctx, :kpi, kpi_fixture(ctx.creator, space_id: ctx.metrics.id))
  end

  step :visit_goal, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :link_kpi, ctx do
    id = Paths.kpi_id(ctx.kpi)

    ctx
    |> UI.click(testid: "link-resource")
    |> UI.click(testid: "choose-#{id}")
    |> UI.assert_has(testid: "linked-#{id}")
  end

  step :visit_linked_kpi, ctx do
    UI.click(ctx, testid: "linked-#{Paths.kpi_id(ctx.kpi)}")
  end

  step :unlink_goal, ctx do
    ctx
    |> UI.click(css: "[data-test-id='kpi-sidebar'] [data-test-id='kpi-goal-field']")
    |> UI.click(testid: "kpi-goal-field-clear")
    |> UI.assert_has(testid: "kpi-goal-field-empty")
  end

  step :link_goal, ctx do
    ctx
    |> UI.click(css: "button[data-test-id='kpi-goal-field-empty']:enabled")
    |> UI.click(testid: UI.testid(["kpi-goal-field", ctx.goal.name]))
    |> UI.wait_until_text(ctx.goal.name, testid: "kpi-goal-field")
  end

  step :visit_linked_goal, ctx do
    ctx
    |> UI.click(css: "button[data-test-id='kpi-goal-field']")
    |> UI.click(testid: "kpi-goal-field-view-goal")
  end

  step :unlink_kpi, ctx do
    id = Paths.kpi_id(ctx.kpi)

    ctx
    |> UI.hover(testid: "linked-#{id}")
    |> UI.click(testid: "unlink-#{id}")
    |> UI.refute_has(testid: "linked-#{id}")
  end
end
