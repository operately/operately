defmodule Operately.Features.Discussions.PublishingTest do
  use Operately.FeatureCase
  use Operately.Support.Features.DiscussionsCase

  feature "post a discussion with blank body", ctx do
    ctx
    |> Steps.start_writting_discussion_with_blank_body()
    |> Steps.submit_discussion()
    |> Steps.assert_discussion_is_posted_with_blank_body()
  end

  feature "edit draft and publish (from the edit draft page)", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.edit_and_publish_draft()
    |> Steps.assert_edited_discussion_is_posted()
    |> Steps.assert_edited_discussion_email_feed_and_notification_sent()
  end

  feature "post a discussion", ctx do
    ctx
    |> Steps.post_a_discussion()
    |> Steps.assert_discussion_is_posted()
    |> Steps.assert_discussion_email_sent()
    |> Steps.assert_discussion_feed_on_space_page()
    |> Steps.assert_discussion_notification_sent()
  end

  feature "edit a posted discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.edit_discussion()
    |> Steps.assert_discussion_is_edited()
  end

  feature "attach a file to a discussion", ctx do
    ctx
    |> Steps.start_writting_discussion()
    |> Steps.attach_file_to_discussion()
    |> Steps.assert_file_is_added()
    |> Steps.submit_discussion()
    |> Steps.assert_discussion_is_posted_with_attachment()
  end

  feature "archive a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.archive_discussion()
    |> Steps.assert_discussion_is_archived()
    |> Steps.assert_discussion_feed_events()
  end
end
