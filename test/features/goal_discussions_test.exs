defmodule Operately.Features.GoalDiscussionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalDiscussionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @discussion_params %{title: "New goal discussion", message: "Let's do this!"}

  @tag login_as: :champion
  feature "start a new goal discussion", ctx do
    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.assert_discussion_submitted(@discussion_params)
    |> Steps.assert_discussion_submitted_email_sent()
    |> Steps.assert_discussion_submitted_feed_posted()
    |> Steps.assert_discussion_submitted_notification_sent()
  end

  # @tag login_as: :champion
  # feature "edit a posted discussion", ctx do
  #   edits = %{title: "Updated goal discussion", message: "Let's do this updated!"}

  #   ctx
  #   |> Steps.start_new_discussion(@discussion_params)
  #   |> Steps.assert_discussion_submitted(@discussion_params)
  #   |> Steps.edit_discussion(@discussion_params, edits)
  #   |> Steps.assert_discusssion_edited(edits)
  # end

  @tag login_as: :champion
  feature "commenting on a posted discussion", ctx do
    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.comment_on_discussion("Great idea!")
    |> Steps.assert_comment_submitted("Great idea!")
    |> Steps.assert_comment_submitted_email_sent()
    |> Steps.assert_comment_submitted_feed_posted()
    |> Steps.assert_comment_submitted_notification_sent()
  end

end
