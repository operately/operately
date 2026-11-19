defmodule Operately.Features.ProjectCheckIns.ListAcknowledgementTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectCheckIns.ListAcknowledgementSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "reviewers see pending acknowledgements and the list updates after acknowledging", ctx do
    ctx
    |> Steps.log_in(:reviewer)
    |> Steps.visit_check_ins()
    |> Steps.assert_mixed_acknowledgements()
    |> Steps.open_pending_check_in()
    |> Steps.acknowledge_check_in()
    |> Steps.return_to_check_ins()
    |> Steps.assert_acknowledged_check_in()
  end

  feature "view-only contributors see pending acknowledgements", ctx do
    ctx
    |> Steps.log_in(:viewer)
    |> Steps.visit_check_ins()
    |> Steps.assert_mixed_acknowledgements()
  end

  feature "champions see pending acknowledgements on their own check-ins", ctx do
    ctx
    |> Steps.log_in(:creator)
    |> Steps.visit_check_ins()
    |> Steps.assert_mixed_acknowledgements()
  end
end
