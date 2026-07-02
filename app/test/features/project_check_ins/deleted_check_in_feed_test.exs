defmodule Operately.Features.ProjectCheckIns.DeletedCheckInFeedTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectCheckInsSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_project_exists()
    |> Steps.given_submitted_acknowledged_commented_check_in()
  end

  feature "company feed loads after check-in is deleted", ctx do
    ctx
    |> Steps.log_in_as_champion()
    |> Steps.visit_check_in_page()
    |> Steps.delete_check_in()
    |> Steps.assert_company_feed_loads_after_check_in_deleted()
  end
end
