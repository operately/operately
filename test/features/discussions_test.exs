defmodule Operately.Features.DiscussionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.DiscussionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "trying to post a discussion without a title", ctx do
    ctx
    |> Steps.start_writting_discussion_with_no_title()
    |> Steps.try_to_submit_draft()
    |> Steps.assert_validation_error()
  end

  feature "post a discussion with blank body", ctx do
    ctx
    |> Steps.start_writting_discussion_with_blank_body()
    |> Steps.submit_discussion()
    |> Steps.assert_discussion_is_posted_with_blank_body()
  end

  feature "post a draft discussion", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.assert_draft_discussion_is_posted()
    |> Steps.assert_draft_is_not_listed_on_space_page()
  end

  feature "share a link to a draft", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.click_on_share_draft_link()
    |> Steps.assert_link_is_visible()
  end

  feature "continue editing a draft message", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.click_on_continue_editing()
    |> Steps.modify_the_draft_discussion_and_save()
    |> Steps.assert_draft_edit_is_saved()
  end

  feature "continue editing last draft in a message board", ctx do
    ctx
    |> Steps.given_a_draft_discussion_exists()
    |> Steps.visit_the_discussion_board()
    |> Steps.click_on_continue_editing_last_draft()
    |> Steps.modify_the_draft_discussion_and_save()
    |> Steps.assert_draft_edit_is_saved()
  end

  feature "listing my drafts and continue editing", ctx do
    ctx
    |> Steps.given_multiple_draft_discussions_exist()
    |> Steps.visit_the_discussion_board()
    |> Steps.click_on_continue_editing_draft()
    |> Steps.modify_the_draft_discussion_and_save()
    |> Steps.assert_draft_edit_is_saved(:draft_discussion_1)
  end

  feature "publish a draft discussion (without editing)", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.publish_draft()
    |> Steps.assert_discussion_is_posted()
    |> Steps.assert_discussion_email_sent()
    |> Steps.assert_discussion_feed_on_space_page()
    |> Steps.assert_discussion_notification_sent()
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

  feature "leave a comment on a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.leave_a_comment()
    |> Steps.assert_comment_notification_and_email_sent()
    |> Steps.assert_comment_is_listed_in_the_feed()
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
