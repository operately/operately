defmodule Operately.Features.ProjectDiscussionTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectDiscussionSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  # TODO
  # feature "listing project discussions", ctx do
  #   ctx
  #   |> Steps.given_several_discussions_exist()
  #   |> Steps.visit_project_page()
  #   |> Steps.assert_discussion_listed()
  # end

  # TODO
  # feature "view a discussion", ctx do
  #   ctx
  #   |> Steps.given_a_discussion_exists()
  #   |> Steps.visit_project_page()
  #   |> Steps.click_on_discussion()
  #   |> Steps.assert_discussion_page_displayed()
  # end

  # TODO
  # feature "commenting on a discussion", ctx do
  #   ctx
  #   |> Steps.given_a_discussion_exists()
  #   |> Steps.visit_discussion_page()
  #   |> Steps.leave_comment("This is a comment")
  #   |> Steps.assert_comment_submitted("This is a comment")
  #   |> Steps.assert_comment_email_sent()
  #   |> Steps.assert_comment_notification_sent()
  #   |> Steps.assert_comment_feed_posted()
  # end

  # TODO
  # feature "writing a new discussion", ctx do
  #   ctx
  #   |> Steps.visit_project_page()
  #   |> Steps.click_new_discussion()
  #   |> Steps.fill_in_discussion_title("New Discussion")
  #   |> Steps.fill_in_discussion_content("Discussion content goes here")
  #   |> Steps.submit_discussion()
  #   |> Steps.assert_discussion_created("New Discussion")
  #   |> Steps.assert_new_discussion_feed_posted()
  #   |> Steps.assert_new_discussion_notification_sent()
  #   |> Steps.assert_new_discussion_email_sent()
  # end

  feature "editing a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.visit_discussion_page()
    |> Steps.click_edit_discussion()
    |> Steps.fill_in_discussion_content("Updated content")
    |> Steps.save_discussion_edit()
    |> Steps.assert_discussion_updated("Updated content")
  end
end
