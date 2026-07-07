defmodule Operately.Features.Discussions.DraftsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.DiscussionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "trying to post a discussion without a title", ctx do
    ctx
    |> Steps.start_writting_discussion_with_no_title()
    |> Steps.try_to_submit_draft()
    |> Steps.assert_validation_error()
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

  feature "discard a draft discussion from the edit page", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.discard_draft_from_edit_page()
    |> Steps.assert_draft_discussion_is_discarded()
    |> Steps.assert_draft_is_not_in_drafts_list()
  end

  feature "discard a draft discussion from the options menu", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.discard_draft_from_options_menu()
    |> Steps.assert_draft_discussion_is_discarded()
    |> Steps.assert_draft_is_not_in_drafts_list()
  end

  feature "discard a draft discussion from the drafts list", ctx do
    ctx
    |> Steps.post_a_draft_discussion()
    |> Steps.discard_draft_from_drafts_list()
    |> Steps.assert_draft_discussion_is_discarded()
    |> Steps.assert_draft_is_not_in_drafts_list()
  end
end
