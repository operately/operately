defmodule Operately.Features.ProjectCheckInsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  alias Operately.Support.Features.ProjectCheckInSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "submitting a check-in", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.assert_check_in_submitted(values)
    |> Steps.assert_check_in_visible_on_project_page(values)
    |> Steps.assert_check_in_visible_on_feed(values)
    # |> Steps.assert_email_sent_to_reviewer(values)
    # |> Steps.assert_notification_sent_to_reviewer(values)
    # |> Steps.assert_next_check_in_scheduled(values)
  end

  # @tag login_as: :champion
  # feature "acknowledge a check-in in the web app", ctx do
  #   values = %{status: "on_track", description: "This is a check-in."}

  #   ctx 
  #   |> Steps.submit_check_in(values)
  #   |> UI.login_as(ctx.reviewer)
  #   |> Steps.assert_check_in_notification_received(values)
  #   |> Steps.open_check_in_from_notification(values)
  #   |> Steps.acknowledge_check_in()
  #   |> Steps.assert_check_in_acknowledged(values)
  # end

  @tag login_as: :champion
  feature "acknowledge a check-in from the email", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx 
    |> Steps.submit_check_in(values)
    |> UI.login_as(ctx.reviewer)
    |> Steps.assert_check_in_email_received()
    |> Steps.assert_check_in_notification_received()
    |> Steps.open_check_in_from_email()
    |> Steps.assert_check_in_acknowledged()
  end

  # @tag login_as: :champion
  # feature "leave a comment on an check-in", ctx do
  #   values = %{status: "on_track", description: "This is a check-in."}

  #   ctx
  #   |> Steps.submit_check_in(values)
  #   |> UI.login_as(ctx.reviewer)
  #   |> Steps.open_check_in_from_notification(values)
  #   |> Steps.leave_comment_on_check_in()
  #   |> UI.login_as(ctx.champion)
  #   |> Steps.assert_comment_on_check_in_received_in_notifications()
  #   |> Steps.assert_comment_on_check_in_received_in_email()
  #   |> Steps.open_check_in_from_email()
  #   |> Steps.assert_comment_visible_on_check_in()
  # end

  # @tag login_as: :champion
  # feature "edit a submitted check-in", ctx do
  #   values = %{status: "on_track", description: "This is a check-in."}

  #   ctx
  #   |> Steps.submit_check_in(values)
  #   |> Steps.assert_check_in_submitted(values)
  #   |> Steps.edit_check_in(%{
  #     content: "This is an edited check-in.",
  #     risks_comments: "This is an edited risk comment."
  #   })

  #   expected_values = 
  #     @check_in_values 
  #     |> Map.put(:content, "This is an edited check-in.")
  #     |> Map.put(:risks_comments, "This is an edited risk comment.")

  #   ctx
  #   |> ProjectCheckInSteps.assert_check_in_submitted(expected_values)
  # end

end
