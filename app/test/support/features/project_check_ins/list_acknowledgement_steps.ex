defmodule Operately.Support.Features.ProjectCheckIns.ListAcknowledgementSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space,
      champion: :creator,
      company_access_level: Binding.view_access(),
      space_access_level: Binding.view_access()
    )
    |> Factory.add_project_reviewer(:reviewer, :project)
    |> Factory.add_project_contributor(:viewer, :project, permissions: :view_access)
    |> Factory.submit_project_check_in(:pending_check_in, :project, :creator)
    |> Factory.submit_project_check_in(:other_pending_check_in, :project, :creator)
    |> Factory.submit_project_check_in(:acknowledged_check_in, :project, :creator)
    |> Factory.acknowledge_project_check_in(:acknowledged_check_in, :reviewer)
  end

  step :log_in, ctx, role do
    case role do
      :creator -> Factory.log_in_person(ctx, :creator)
      contributor -> Factory.log_in_contributor(ctx, contributor)
    end
  end

  step :visit_check_ins, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project, tab: "check-ins"))
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
    |> UI.assert_has(testid: "project-check-in-page")
  end

  step :acknowledge_check_in, ctx do
    ctx
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.refute_has(testid: "acknowledge-check-in")
  end

  step :return_to_check_ins, ctx do
    UI.click(ctx, testid: UI.testid(["nav-item", "Check-Ins"]))
  end

  step :assert_acknowledged_check_in, ctx do
    ctx
    |> UI.assert_has(css: card(ctx, :pending_check_in))
    |> UI.refute_has(css: pending_label(ctx, :pending_check_in))
    |> UI.assert_has(css: pending_label(ctx, :other_pending_check_in))
  end

  defp card(ctx, key) do
    path = Paths.project_check_in_path(ctx.company, Map.fetch!(ctx, key))
    ~s(a[href="#{path}"])
  end

  defp pending_label(ctx, key) do
    card(ctx, key) <> ~s( [data-test-id="check-in-pending-acknowledgement"])
  end
end
