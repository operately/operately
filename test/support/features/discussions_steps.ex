defmodule Operately.Support.Features.DiscussionsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Messages.Message

  @title "This is a discussion"
  @body "This is the body of the discussion."

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing_space)
    |> Factory.add_space_member(:author, :marketing_space)
    |> Factory.add_space_member(:reader, :marketing_space)
    |> Factory.log_in_person(:author)
  end

  step :post_a_discussion, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: @title)
    |> UI.fill_rich_text(@body)
    |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_is_posted, ctx do
    message = last_message(ctx)

    assert message.state == :published

    ctx
    |> UI.assert_page(Paths.message_path(ctx.company, message))
    |> UI.assert_text(@title)
    |> UI.assert_text(@body)
  end

  step :assert_discussion_is_posted_with_blank_body, ctx do
    message = last_message(ctx)

    assert message.state == :published

    ctx
    |> UI.assert_page(Paths.message_path(ctx.company, message))
    |> UI.assert_text(@title)
  end

  step :assert_discussion_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.marketing_space.name,
      to: ctx.reader,
      author: ctx.author,
      action: "posted: #{@title}"
    })
  end

  step :assert_discussion_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reader)
    |> NotificationsSteps.assert_discussion_posted(author: ctx.author, title: @title)
  end

  step :assert_discussion_feed_on_space_page, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.assert_text(@title)
    |> UI.assert_text(@body)
  end

  step :start_writting_discussion, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.assert_page(Paths.space_discussions_new_path(ctx.company, ctx.marketing_space))
    |> UI.fill(testid: "discussion-title", with: @title)
  end

  step :start_writting_discussion_with_no_title, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.assert_page(Paths.space_discussions_new_path(ctx.company, ctx.marketing_space))
  end

  step :start_writting_discussion_with_blank_body, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.assert_page(Paths.space_discussions_new_path(ctx.company, ctx.marketing_space))
    |> UI.fill(testid: "discussion-title", with: @title)
  end

  step :try_to_submit_draft, ctx do
    ctx |> UI.click(testid: "save-as-draft")
  end

  step :assert_validation_error, ctx do
    ctx |> UI.assert_text("Please add a title")
  end

  step :attach_file_to_discussion, ctx do
    # There is no direct way to interact with the file input field in Wallaby
    # so as a workaround, we do two implicit tests:
    #
    # 1. we trigger the click event on the input field, and test if a test flag was set.
    # 2. we upload a file by typing the path in the input field.
    #

    # The file path is based on where the app is running inside of docker.
    # The assumption is the project is mounted at /home/dev/app and that we can access README.md.

    ctx
    |> UI.click(testid: "toolbar-button-add-an-image-or-file")
    |> UI.assert_has(Wallaby.Query.css("[data-test-upload-triggered=true]", visible: false))
    |> UI.upload_file(testid: "attachment-input-field", path: "/home/dev/app/README.md")
    |> UI.sleep(1000)
  end

  step :assert_file_is_added, ctx do
    ctx |> UI.assert_text("README.md")
  end

  step :submit_discussion, ctx do
    ctx
    |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_is_posted_with_attachment, ctx do
    message = last_message(ctx)

    ctx
    |> UI.assert_page(Paths.message_path(ctx.company, message))
    |> UI.assert_text(@title)
    |> UI.assert_text("README.md")
  end

  step :given_a_discussion_exists, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :edit_discussion, ctx do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is an edited discussion")
    |> UI.fill_rich_text("This is the edited body of the discussion.")
    |> UI.click(testid: "save-changes")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :assert_discussion_is_edited, ctx do
    message = last_message(ctx)

    assert message.title == "This is an edited discussion"

    ctx
    |> UI.assert_text("This is an edited discussion")
    |> UI.assert_text("This is the edited body of the discussion")
  end

  step :post_a_draft_discussion, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: @title)
    |> UI.fill_rich_text(@body)
    |> UI.click(testid: "save-as-draft")
    |> UI.assert_has(testid: "discussion-page")
    |> then(fn ctx ->
      Map.put(ctx, :draft_discussion, last_message(ctx))
    end)
  end

  step :assert_draft_discussion_is_posted, ctx do
    discussion = last_message(ctx)

    assert discussion.state == :draft
    assert discussion.title == @title

    ctx
  end

  step :assert_draft_is_not_listed_on_space_page, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "messages-tool")
    |> UI.assert_has(testid: "discussions-page")
    |> UI.refute_text(@title)
  end

  step :click_on_continue_editing, ctx do
    ctx
    |> UI.click(testid: "continue-editing")
    |> UI.assert_has(testid: "discussion-edit-page")
  end

  step :modify_the_draft_discussion_and_save, ctx do
    ctx
    |> UI.fill(testid: "discussion-title", with: "This is a draft discussion (edited)")
    |> UI.fill_rich_text("This is the body of the discussion. (edited)")
    |> UI.click(testid: "save-changes")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :assert_draft_edit_is_saved, ctx, message_name \\ :draft_discussion do
    assert {:ok, discussion} = Message.get(:system, id: ctx[message_name].id)

    assert discussion.state == :draft
    assert discussion.title =~ ~r/edited/

    ctx
  end

  step :publish_draft, ctx do
    ctx
    |> UI.click(testid: "publish-now")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :leave_a_comment, ctx do
    message = last_message(ctx)

    ctx
    |> UI.login_as(ctx.reader)
    |> UI.visit(Paths.message_path(ctx.company, message))
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
  end

  step :assert_comment_notification_and_email_sent, ctx do
    ctx
    |> UI.login_as(ctx.author)
    |> NotificationsSteps.assert_discussion_commented_sent(author: ctx.reader, title: @title)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.marketing_space.name,
      to: ctx.author,
      author: ctx.reader,
      action: "commented on: #{@title}"
    })
  end

  step :visit_the_discussion_board, ctx do
    ctx |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
  end

  step :given_a_draft_discussion_exists, ctx do
    ctx
    |> Factory.add_messages_board(:messages_board, :marketing_space)
    |> Factory.add_message(:draft_discussion, :messages_board, [
      state: :draft,
      creator: ctx.author
    ])
  end

  step :click_on_continue_editing_last_draft, ctx do
    ctx |> UI.click(testid: "continue-editing-draft")
  end

  step :given_multiple_draft_discussions_exist, ctx do
    ctx
    |> Factory.add_messages_board(:messages_board, :marketing_space)
    |> Factory.add_message(:draft_discussion_1, :messages_board, [
      state: :draft,
      creator: ctx.author,
      title: "Draft discussion 1"
    ])
    |> Factory.add_message(:draft_discussion_2, :messages_board, [
      state: :draft,
      creator: ctx.author,
      title: "Draft discussion 2"
    ])
  end

  step :click_on_continue_editing_draft, ctx do
    ctx
    |> UI.click(testid: "continue-editing-draft")
    |> UI.click(testid: "discussion-list-item-draft-discussion-1")
  end

  step :edit_and_publish_draft, ctx do
    ctx
    |> UI.click(testid: "continue-editing")
    |> UI.assert_has(testid: "discussion-edit-page")
    |> UI.fill(testid: "discussion-title", with: "This is a draft discussion (edited)")
    |> UI.fill_rich_text("This is the body of the discussion. (edited)")
    |> UI.click(testid: "publish-now")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :assert_edited_discussion_is_posted, ctx do
    message = last_message(ctx)

    assert message.state == :published

    ctx
    |> UI.assert_page(Paths.message_path(ctx.company, message))
    |> UI.assert_text("This is a draft discussion (edited)")
    |> UI.assert_text("This is the body of the discussion. (edited)")
  end

  step :assert_edited_discussion_email_feed_and_notification_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.marketing_space.name,
      to: ctx.reader,
      author: ctx.author,
      action: "posted: This is a draft discussion (edited)"
    })
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.assert_text("This is a draft discussion (edited)")
    |> UI.assert_text("This is the body of the discussion. (edited)")
    |> UI.login_as(ctx.reader)
    |> NotificationsSteps.assert_discussion_posted(author: ctx.author, title: "This is a draft discussion (edited)")
  end

  step :click_on_share_draft_link, ctx do
    UI.click(ctx, testid: "share-link")
  end

  step :assert_link_is_visible, ctx do
    UI.assert_text(ctx, Paths.message_path(ctx.company, last_message(ctx)))
  end

  step :archive_discussion, ctx do
    message = last_message(ctx)

    ctx
    |> UI.visit(Paths.message_path(ctx.company, message))
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "archive-discussion")
  end

  step :assert_discussion_is_archived, ctx do
    message = last_archived_message(ctx)

    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.refute_text(message.title)
  end

  step :assert_discussion_feed_events, ctx do
    message = last_archived_message(ctx)

    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.assert_feed_item(ctx.creator, "deleted: #{message.title}")
  end

  step :assert_comment_is_listed_in_the_feed, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.assert_feed_item(ctx.reader, "commented on #{@title}")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.reader, "commented on #{@title}")
  end

  #
  # Utilities
  #

  defp last_archived_message(ctx, attempts \\ 3) do
    import Ecto.Query

    message = Operately.Repo.one(
      from m in Operately.Messages.Message,
      where: not is_nil(m.deleted_at),
      limit: 1
    )

    cond do
      message -> message
      attempts <= 0 -> raise "Could not find the last archived message"
      true ->
        :timer.sleep(300)
        last_archived_message(ctx, attempts - 1)
    end
  end

  defp last_message(ctx, attempts \\ 3) do
    import Ecto.Query
    message = Operately.Repo.one(from m in Operately.Messages.Message, order_by: [desc: m.updated_at], limit: 1)

    cond do
      message -> message
      attempts <= 0 -> raise "Could not find the last message"
      true ->
        :timer.sleep(300)
        last_message(ctx, attempts - 1)
    end
  end
end
