defmodule Operately.Support.Features.DiscussionsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :post_a_discussion, ctx, params do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: params[:title])
    |> UI.fill_rich_text(params[:body])
    |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_is_posted, ctx do
    message = last_message(ctx)

    ctx
    |> UI.assert_page(Paths.message_path(ctx.company, message))
    |> UI.assert_text("This is a discussion")
    |> UI.assert_text("This is the body of the discussion.")
  end

  step :assert_discussion_email_sent, ctx, params do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.reader,
      author: ctx.author,
      action: "posted: #{params[:title]}"
    })
  end

  step :assert_discussion_notification_sent, ctx, params do
    ctx
    |> UI.login_as(ctx.reader)
    |> NotificationsSteps.assert_discussion_posted(author: ctx.author, title: params[:title])
  end

  step :assert_discussion_feed_on_space_page, ctx, params do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.assert_text(params[:title])
    |> UI.assert_text(params[:body])
  end

  step :start_writting_discussion, ctx, params do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
    |> UI.assert_page(Paths.space_discussions_new_path(ctx.company, ctx.space))
    |> UI.fill(testid: "discussion-title", with: params[:title])
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
    |> UI.assert_text("Testing file attachment")
    |> UI.assert_text("README.md")
  end

  step :given_the_draft_experimental_feature_is_enabled, ctx do
    Factory.enable_feature(ctx, "draft_discussions")
  end

  step :post_a_draft_discussion, ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "My draft discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-draft-discussion")
    |> UI.assert_has(testid: "discussion-page")
  end

  step :assert_draft_discussion_is_posted, ctx do
    discussion = last_message(ctx)

    assert discussion.state == "draft"
    assert discussion.title == "My draft discussion"

    ctx
  end

  step :assert_draft_is_not_listed_on_space_page, ctx do
    ctx 
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.click(testid: "messages-tool")
    |> UI.refute_text("Draft discussion")
  end

  #
  # Utilities
  #

  defp last_message(ctx) do
    messages = Operately.Messages.list_messages(ctx.space.id)

    if messages != [] do
      hd(messages)
    else
      # sometimes the updates are not immediately available
      # so we wait a bit and try again
      :timer.sleep(300)
      Operately.Messages.list_messages(ctx.space.id) |> hd()
    end
  end
end
