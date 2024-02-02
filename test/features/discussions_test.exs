defmodule Operately.Features.DiscussionsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    author = person_fixture_with_account(%{full_name: "Andy Author", company_id: company.id})
    reader = person_fixture_with_account(%{full_name: "Randy Reader", company_id: company.id})

    space = group_fixture(author, %{name: "Marketing", mission: "Let the world know about our products"})

    Operately.Groups.add_member(space, author.id)
    Operately.Groups.add_member(space, reader.id)

    ctx = Map.merge(ctx, %{company: company, author: author, reader: reader, space: space})
    ctx = UI.login_as(ctx, ctx.author)

    {:ok, ctx}
  end

  @tag login_as: :author
  feature "post a discussion", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.space.id}/discussions")
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")

    discussion = last_discussion(ctx)

    ctx
    |> UI.visit("/spaces/#{ctx.space.id}/discussions/#{discussion.id}")
    |> UI.assert_text("This is a discussion")
    |> UI.assert_text("This is the body of the discussion.")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.reader,
      author: ctx.author,
      action: "posted: This is a discussion"
    })  

    ctx
    |> UI.login_as(ctx.reader)
    |> NotificationsSteps.assert_discussion_posted(
      author: ctx.author, 
      title: "This is a discussion"
    )
  end

  @tag login_as: :author
  feature "leave a comment on a discussion", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.space.id}/discussions")
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")
    |> UI.assert_text("Posted on")

    discussion = last_discussion(ctx)

    ctx
    |> UI.login_as(ctx.reader)
    |> UI.visit("/spaces/#{ctx.space.id}/discussions/#{discussion.id}")
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
    |> UI.visit("/spaces/#{ctx.space.id}/discussions")
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is a discussion")
    |> UI.fill_rich_text("This is the body of the discussion.")
    |> UI.click(testid: "post-discussion")
    |> UI.assert_text("Posted on")

    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-discussion")
    |> UI.fill(testid: "discussion-title", with: "This is an edited discussion")
    |> UI.fill_rich_text("This is the edited body of the discussion.")
    |> UI.click(testid: "save-changes")

    ctx
    |> UI.assert_text("Posted on")
    |> UI.assert_text("This is an edited discussion")
    |> UI.assert_text("This is the edited body of the discussion")
  end

  #
  # Utilities
  #
  defp last_discussion(ctx) do
    Operately.Updates.list_updates(ctx.space.id, :space, :project_discussion) |> hd()
  end
end
