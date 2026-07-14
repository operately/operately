defmodule Operately.Features.ProjectCheckIns.SchedulingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectCheckInsSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_project_exists()
    |> Steps.log_in_as_champion()
  end

  feature "scheduled project check-in shows its status and publication date", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.assert_scheduled_check_in_details()
  end

  feature "scheduled project check-in can be published immediately", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.publish_scheduled_check_in_now()
    |> Steps.assert_scheduled_check_in_is_published()
  end

  feature "scheduled project check-in can be saved as a draft", ctx do
    ctx
    |> Steps.given_a_scheduled_check_in_exists()
    |> Steps.visit_scheduled_check_in()
    |> Steps.save_scheduled_check_in_as_draft()
    |> Steps.assert_scheduled_check_in_is_a_draft()
  end
end
