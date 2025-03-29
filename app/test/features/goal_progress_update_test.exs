defmodule Operately.Features.GoalProgressUpdateTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalProgressUpdateSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "check-in on a goal", ctx do
    params = %{status: "on_track", message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.assert_progress_updated(params)
    |> Steps.assert_progress_update_in_feed()
    |> Steps.assert_progress_update_in_notifications()
  end

  feature "acknowledge a progress update in the web app", ctx do
    params = %{status: "caution", message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.acknowledge_progress_update()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_progress_update_acknowledged_in_feed()
    |> Steps.assert_progress_update_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in from the email", ctx do
    params = %{status: "caution", message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.acknowledge_check_in_from_email()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_progress_update_acknowledged_in_feed()
    |> Steps.assert_progress_update_acknowledged_in_notifications()
  end

  feature "edit a submitted progress update", ctx do
    params = %{status: "issue", message: "Checking-in on my goal", target_values: [20, 80]}
    edit_params = %{status: "on_track", message: "This is an edited check-in.", target_values: [30, 70]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.edit_progress_update(edit_params)
    |> Steps.assert_progress_update_edited(edit_params)
  end

  feature "commenting on a progress update", ctx do
    params = %{status: "pending", message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.comment_on_progress_update_as_reviewer("Great job!")
    |> Steps.assert_progress_update_commented_in_feed("Great job!")
    |> Steps.assert_progress_update_commented_in_notifications()
    |> Steps.assert_progress_update_commented_notification_redirects_on_click()
    |> Steps.assert_comment_email_sent()
  end
end
