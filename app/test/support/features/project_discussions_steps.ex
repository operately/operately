defmodule Operately.Support.Features.ProjectDiscussionSteps do
  use Operately.FeatureCase
  alias Operately.Support.RichText
  alias Operately.Access.Binding

  import Ecto.Query, only: [from: 2]

  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
    |> Factory.add_project_reviewer(:reviewer, :project)
    |> Factory.log_in_person(:creator)
  end

  step :given_project_in_secret_space_for_champion, ctx do
    ctx
    |> Factory.add_company_member(:champion)
    |> Factory.add_company_member(:reviewer)
    |> Factory.add_space(:secret_space, company_permissions: Binding.no_access())
    |> Factory.add_project(:secret_project, :secret_space, champion: :champion, reviewer: :reviewer)
    |> Factory.log_in_person(:champion)
  end

  step :given_several_discussions_exist, ctx do
    ctx
    |> Factory.add_project_discussion(:discussion1, :project, title: "Discussion 1", message: "Content for discussion 1")
    |> Factory.add_project_discussion(:discussion2, :project, title: "Discussion 2", message: "Content for discussion 2")
    |> Factory.add_project_discussion(:discussion3, :project, title: "Discussion 3", message: "Content for discussion 3")
  end

  step :visit_project_page, ctx, project_key \\ :project do
    project = Map.fetch!(ctx, project_key)

    ctx |> UI.visit(OperatelyWeb.Paths.project_path(ctx.company, project, tab: "discussions"))
  end

  step :visit_discussion_page, ctx do
    ctx |> UI.visit(OperatelyWeb.Paths.project_discussion_path(ctx.company, ctx.discussion))
  end

  step :assert_discussion_listed, ctx do
    ctx
    |> UI.assert_text("Discussion 1")
    |> UI.assert_text("Discussion 2")
    |> UI.assert_text("Discussion 3")
  end

  step :given_a_discussion_exists, ctx do
    ctx |> Factory.add_project_discussion(:discussion, :project, title: "Existing Discussion", message: "Content for existing discussion")
  end

  step :click_on_discussion, ctx do
    UI.find(ctx, UI.query(testid: "project-discussions-section"), fn ctx ->
      ctx |> UI.click_link("Existing Discussion")
    end)
  end

  step :assert_discussion_page_displayed, ctx do
    ctx
    |> UI.assert_text("Existing Discussion")
    |> UI.assert_text("Content for existing discussion")
  end

  step :assert_project_discussion_new_navigation_without_space, ctx do
    ctx
    |> UI.assert_has(testid: UI.testid(["nav-item", "Work Map"]))
    |> UI.assert_has(testid: UI.testid(["nav-item", ctx.secret_project.name]))
    |> UI.assert_has(testid: UI.testid(["nav-item", "Discussions"]))
    |> UI.refute_has(testid: UI.testid(["nav-item", ctx.secret_space.name]))
  end

  step :assert_project_discussion_navigation_without_space, ctx do
    ctx
    |> UI.assert_has(testid: UI.testid(["nav-item", "Work Map"]))
    |> UI.assert_has(testid: UI.testid(["nav-item", ctx.secret_project.name]))
    |> UI.assert_has(testid: UI.testid(["nav-item", "Discussions"]))
    |> UI.refute_has(testid: UI.testid(["nav-item", ctx.secret_space.name]))
  end

  step :click_new_discussion, ctx do
    ctx |> UI.click(testid: "start-discussion")
  end

  step :fill_in_discussion_title, ctx, title do
    ctx |> UI.fill(testid: "discussion-title", with: title)
  end

  step :fill_in_discussion_content, ctx, content do
    ctx |> UI.fill_rich_text(content)
  end

  step :submit_discussion, ctx do
    ctx |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_created, ctx, title do
    attempts(ctx, 5, fn ->
      record = Operately.Repo.one(from d in Operately.Comments.CommentThread, where: d.title == ^title)
      assert record != nil

      ctx
    end)
  end

  step :click_edit_discussion, ctx do
    ctx
    |> UI.click(testid: "edit")
  end

  step :save_discussion_edit, ctx do
    ctx |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_updated, ctx, content do
    attempts(ctx, 5, fn ->
      record = Operately.Repo.get(Operately.Comments.CommentThread, ctx.discussion.id)
      assert record != nil
      assert record.message == RichText.rich_text(content)

      ctx
    end)
  end

  step :assert_new_discussion_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "posted New Discussion"
    })
  end

  step :assert_new_discussion_notification_sent, ctx do
    ctx
    |> login_as_reviewer()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Posted: New Discussion"
    })
  end

  step :assert_new_discussion_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.creator,
      action: "posted: New Discussion"
    })
  end

  step :leave_comment, ctx, comment do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(comment)
    |> UI.click(testid: "post-comment")
    |> UI.sleep(300)
    |> UI.refute_has(testid: "post-comment")
    |> then(fn ctx ->
      comment = last_comment(ctx)
      Map.put(ctx, :comment, comment)
    end)
  end

  step :assert_comment_submitted, ctx, message do
    attempts(ctx, 5, fn ->
      comment = last_comment(ctx)

      assert comment != nil
      assert comment.author_id == ctx.creator.id
      assert comment.content == %{"message" => RichText.rich_text(message)}

      ctx
    end)
  end

  step :assert_comment_notification_sent, ctx do
    ctx
    |> login_as_reviewer()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.creator,
      action: "Re: Existing Discussion"
    })
  end

  step :assert_comment_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.creator,
      action: "commented on: Existing Discussion"
    })
  end

  step :assert_comment_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "posted Existing Discussion"
    })
  end

  step :delete_comment, ctx, comment do
    ctx
    |> UI.assert_text(comment)
    |> UI.click(testid: "comment-options")
    |> UI.click(testid: "delete-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_deleted, ctx do
    ctx
    |> UI.refute_has(testid: "comment-#{ctx.comment.id}")
  end

  step :assert_comment_feed_posted_after_deletion, ctx do
    author = ctx.creator
    title = ctx.discussion.title

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.assert_feed_item(author, "commented on #{title}")
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing))
    |> UI.assert_feed_item(author, "commented on #{title} in the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(author, "commented on #{title} in the #{ctx.project.name} project")
  end

  #
  # Helper functions
  #

  defp last_comment(ctx) do
    record = Operately.Repo.get(Operately.Comments.CommentThread, ctx.discussion.id)
    Operately.Updates.list_comments(record.id, :comment_thread) |> Enum.at(-1)
  end

  def login_as_reviewer(ctx) do
    person = Map.fetch!(ctx, :reviewer) |> Operately.Repo.preload(:person) |> Map.get(:person)
    ctx |> UI.login_as(person)
  end
end
