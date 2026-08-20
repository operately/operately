defmodule Operately.Features.ProjectCheckIns.DraftsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectCheckInsSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_project_exists()
    |> Steps.log_in_as_champion()
  end

  feature "saving a check-in as a draft", ctx do
    values = %{status: "on_track", description: "This is a draft check-in."}

    ctx
    |> Steps.save_check_in_as_draft(values)
    |> Steps.assert_check_in_is_draft(values)
  end

  feature "publishing a draft check-in from the edit page", ctx do
    ctx
    |> Steps.given_a_draft_check_in_exists()
    |> Steps.publish_draft_check_in()
    |> Steps.assert_draft_check_in_is_published()
  end

  feature "notification settings are shown when publishing a draft check-in", ctx do
    ctx
    |> Steps.given_a_draft_check_in_exists()
    |> Steps.publish_draft_check_in_with_notify_selection()
    |> Steps.assert_draft_check_in_is_published()
    |> Steps.assert_current_subscribers_after_draft_publish()
  end
end
