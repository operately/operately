defmodule Operately.Features.GoalCheckInTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCheckInSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "check-in on a goal", ctx do
    params = %{message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.assert_progress_updated(params)
    |> Steps.assert_progress_update_in_feed()
    |> Steps.assert_progress_update_in_notifications()
  end

  @tag login_as: :champion
  feature "acknowledge a progress update", ctx do
    params = %{message: "Checking-in on my goal", target_values: [20, 80]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.acknowledge_progress_update()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_progress_update_acknowledged_in_feed()
    |> Steps.assert_progress_update_acknowledged_in_notifications()
  end

  @tag login_as: :champion
  feature "edit a submitted progress update", ctx do
    params = %{message: "Checking-in on my goal", target_values: [20, 80]}
    edit_params = %{message: "This is an edited check-in.", target_values: [30, 70]}

    ctx
    |> Steps.visit_page()
    |> Steps.update_progress(params)
    |> Steps.edit_progress_update(edit_params)
    |> Steps.assert_progress_update_edited(edit_params)
  end
  
end
