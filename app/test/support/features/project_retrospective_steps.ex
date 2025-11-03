defmodule Operately.Support.Features.ProjectRetrospectiveSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  step :setup, ctx do
    ctx
    |> ProjectSteps.create_project(name: "Test Project")
    |> ProjectSteps.login()
  end

  step :visit_retrospective_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "closed-status-banner"), fn el ->
      el
      |> UI.assert_text("This project was closed on")
      |> UI.click_text("retrospective")
    end)
  end

  step :initiate_project_closing, ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.find(UI.query(testid: "actions-section"), fn el ->
      UI.click_text(el, "Close project")
    end)
  end

  step :fill_in_retrospective, ctx, params do
    ctx
    |> fill_rich_text("retrospective-notes", params["notes"])
  end

  step :submit_retrospective, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.sleep(300)
    |> then(fn ctx ->
      case Operately.Projects.Retrospective.get(:system, project_id: ctx.project.id) do
        {:ok, retrospective} ->
          Map.put(ctx, :retrospective, retrospective)
        {:error, _} ->
          ctx
      end
    end)
  end

  step :edit_project_retrospective, ctx, notes do
    ctx
    |> UI.sleep(200)
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "edit-retrospective")
    |> fill_rich_text("retrospective-notes", notes)
  end

  step :assert_project_retrospective_edited, ctx, notes do
    ctx
    |> UI.assert_text(notes)
  end

  step :assert_project_retrospective_posted, ctx, params do
    ctx
    |> UI.click(testid: "tab-activity")
    |> FeedSteps.assert_project_retrospective_posted(author: params["author"])
    |> UI.find(UI.query(testid: "closed-status-banner"), fn el ->
      el
      |> UI.assert_text("This project was closed on")
      |> UI.click_text("retrospective")
    end)
    |> UI.assert_text(params["author"].full_name)
    |> UI.assert_text(params["notes"])
  end

  step :assert_email_sent, ctx do
    email = UI.Emails.last_sent_email()
    assert email.html =~ "We built the thing"

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "closed the project and submitted a retrospective"
    })
  end

  step :assert_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_retrospective_sent(author: ctx.champion)
  end

  step :assert_retrospective_error, ctx do
    ctx |> UI.assert_text("Can't be empty")
  end

  step :leave_comment, ctx, comment do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(comment)
    |> UI.click(testid: "post-comment")
    |> UI.refute_has(testid: "post-comment")
    |> UI.sleep(300)
    |> then(fn ctx ->
      comment = last_comment(ctx)
      Map.put(ctx, :comment, comment)
    end)
  end

  step :assert_comment_present, ctx do
    ctx
    |> UI.assert_text("This is a comment.")
  end

  step :delete_comment, ctx do
    ctx
    |> UI.click(testid: "comment-options")
    |> UI.click(testid: "delete-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_deleted, ctx do
    ctx
    |> UI.refute_has(testid: "comment-#{ctx.comment.id}")
  end

  defp fill_rich_text(ctx, testid, content) do
    ctx
    |> UI.find(UI.query(testid: testid), fn el ->
      UI.fill_rich_text(el, content)
    end)
  end

  defp last_comment(ctx) do
    Operately.Updates.list_comments(ctx.retrospective.id, :project_retrospective) |> List.last()
  end
end
