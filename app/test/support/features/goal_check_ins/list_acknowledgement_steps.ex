defmodule Operately.Support.Features.GoalCheckIns.ListAcknowledgementSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:reviewer)
    |> Factory.add_company_member(:viewer)
    |> Factory.add_goal(:goal, :space,
      champion: :creator,
      reviewer: :reviewer,
      company_access: Binding.view_access(),
      space_access: Binding.view_access()
    )
    |> Factory.add_goal_update(:pending_check_in, :goal, :creator)
    |> Factory.add_goal_update(:other_pending_check_in, :goal, :creator)
    |> Factory.add_goal_update(:acknowledged_check_in, :goal, :creator)
    |> Factory.acknowledge_goal_update(:acknowledged_check_in, :reviewer)
  end

  step :log_in, ctx, role do
    Factory.log_in_person(ctx, role)
  end

  step :visit_check_ins, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal, tab: "check-ins"))
  end

  step :assert_mixed_acknowledgements, ctx do
    ctx
    |> UI.assert_has(css: pending_label(ctx, :pending_check_in))
    |> UI.assert_has(css: pending_label(ctx, :other_pending_check_in))
    |> UI.assert_has(css: card(ctx, :acknowledged_check_in))
    |> UI.refute_has(css: pending_label(ctx, :acknowledged_check_in))
  end

  step :open_pending_check_in, ctx do
    ctx
    |> UI.click(css: card(ctx, :pending_check_in))
    |> UI.assert_has(testid: "goal-check-in-page")
  end

  step :acknowledge_check_in, ctx do
    ctx
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.refute_has(testid: "acknowledge-check-in")
  end

  step :return_to_check_ins, ctx do
    UI.click(ctx, testid: UI.testid(["nav-item", "Check-ins"]))
  end

  step :assert_acknowledged_check_in, ctx do
    ctx
    |> UI.assert_has(css: card(ctx, :pending_check_in))
    |> UI.refute_has(css: pending_label(ctx, :pending_check_in))
    |> UI.assert_has(css: pending_label(ctx, :other_pending_check_in))
  end

  defp card(ctx, key) do
    path = Paths.goal_check_in_path(ctx.company, Map.fetch!(ctx, key))
    ~s(a[href="#{path}"])
  end

  defp pending_label(ctx, key) do
    card(ctx, key) <> ~s( [data-test-id="check-in-pending-acknowledgement"])
  end
end
