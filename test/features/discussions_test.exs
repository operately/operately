defmodule Operately.Features.DiscussionsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Access.Binding

  alias Operately.Support.Features.DiscussionsSteps, as: Steps

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    author = person_fixture_with_account(%{full_name: "Andy Author", company_id: company.id})
    reader = person_fixture_with_account(%{full_name: "Randy Reader", company_id: company.id})

    space = group_fixture(author, %{name: "Marketing", mission: "Let the world know about our products"})

    Operately.Groups.add_members(author, space.id, [
      %{
        id: reader.id,
        access_level: Binding.comment_access(),
      },
    ])

    ctx = Map.merge(ctx, %{company: company, author: author, reader: reader, space: space})
    ctx = UI.login_as(ctx, ctx.author)

    {:ok, ctx}
  end

  @discussion %{
    title: "This is a discussion",
    body: "This is the body of the discussion."
  }

  @tag login_as: :author
  feature "post a draft discussion", ctx do
    ctx
    |> Steps.given_the_draft_experimental_feature_is_enabled()
    |> Steps.post_a_draft_discussion()
    |> Steps.assert_draft_discussion_is_posted()
    |> Steps.assert_draft_is_not_listed_on_space_page()
  end

  @tag login_as: :author
  feature "continue editing a draft message", ctx do
    ctx
    |> Steps.given_the_draft_experimental_feature_is_enabled()
    |> Steps.post_a_draft_discussion()
    |> Steps.click_on_continue_editing()
    |> Steps.modify_the_draft_discussion_and_save()
    |> Steps.assert_draft_edit_is_saved()
  end

  @tag login_as: :author
  feature "post a discussion", ctx do
    ctx
    |> Steps.post_a_discussion(@discussion)
    |> Steps.assert_discussion_is_posted()
    |> Steps.assert_discussion_email_sent(@discussion)
    |> Steps.assert_discussion_feed_on_space_page(@discussion)
    |> Steps.assert_discussion_notification_sent(@discussion)
  end

  @tag login_as: :author
  feature "leave a comment on a discussion", ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")
    |> UI.assert_text("just now")

    message = last_message(ctx)

    ctx
    |> UI.login_as(ctx.reader)
    |> UI.visit(Paths.message_path(ctx.company, message))
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")

    ctx
    |> UI.login_as(ctx.author)
    |> NotificationsSteps.assert_discussion_commented_sent(author: ctx.reader, title: "This is a discussion")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.author,
      author: ctx.reader,
      action: "commented on: This is a discussion"
    })
  end

  @tag login_as: :author
  feature "edit a posted discussion", ctx do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")
    |> UI.assert_text("just now")

    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is an edited discussion")
    |> UI.fill_rich_text("This is the edited body of the discussion.")
    |> UI.click(testid: "save-changes")

    ctx
    |> UI.assert_text("just now")
    |> UI.assert_text("This is an edited discussion")
    |> UI.assert_text("This is the edited body of the discussion")
  end

  @tag login_as: :author
  feature "attach a file to a discussion", ctx do
    ctx
    |> Steps.start_writting_discussion(%{title: "Testing file attachment"})
    |> Steps.attach_file_to_discussion()
    |> Steps.assert_file_is_added()
    |> Steps.submit_discussion()
    |> Steps.assert_discussion_is_posted_with_attachment()
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
