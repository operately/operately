defmodule Operately.Features.GoalCheckIns.SchedulingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "scheduled goal check-in shows its status and publication date", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.assert_scheduled_check_in_details()
  end

  feature "scheduled goal check-in can be published immediately", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.publish_scheduled_check_in_now()
    |> Steps.assert_scheduled_check_in_is_published()
  end

  feature "scheduled goal check-in can be saved as a draft", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.save_scheduled_check_in_as_draft()
    |> Steps.assert_scheduled_check_in_is_a_draft()
  end

  feature "discarding a scheduled check-in refreshes the goal list", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_check_ins_tab()
    |> UI.click(testid: "check-in-title")
    |> Steps.open_discard_modal()
    |> Steps.discard_check_in_and_assert_removed()
  end
end
