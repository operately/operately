defmodule Operately.Support.Features.ProjectMilestonesSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.{EmailSteps, NotificationsSteps, FeedSteps}
  alias Operately.ContextualDates.ContextualDate
  alias OperatelyWeb.Paths

  step :given_that_a_milestone_exists, ctx, title do
    {:ok, milestone} = Operately.Projects.create_milestone(%{
      project_id: ctx.project.id,
      title: title,
      timeframe: %{
        contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
        contextual_end_date: ContextualDate.create_day_date(~D[2023-06-17]),
      }
    })

    Map.put(ctx, :milestone, milestone)
  end

  step :visit_milestone_page, ctx do
    path = Paths.project_milestone_path(ctx.company, ctx.milestone)
    UI.visit(ctx, path)
  end

  step :visit_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :reload_project_page, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
  end

  step :add_first_milestone, ctx, name: name do
     ctx
    |> UI.click_button("Add your first milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_milestone, ctx, name: name do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_milestone, ctx, name: name, due_date: due_date do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.fill(testid: "milestone-name-input", with: name)
    |> UI.select_day_in_date_field(testid: "new-milestone-due-date", date: due_date)
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      UI.click_button(el, "Add milestone")
    end)
  end

  step :add_multiple_milestones, ctx, names: names do
    ctx
    |> UI.click_button("Add milestone")
    |> UI.click(testid: "add-more-switch")
    |> UI.find(UI.query(testid: "add-milestone-form"), fn el ->
      Enum.reduce(names, el, fn name, el ->
        el
        |> UI.fill(testid: "milestone-name-input", with: name)
        |> UI.click_button("Add milestone")
      end)
    end)
    |> UI.click_button("Cancel")
  end

  step :edit_milestone, ctx, name: name, new_name: new_name, new_due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      el
      |> UI.hover(testid: UI.testid(["milestone", name]))
      |> UI.click_button("Edit")
    end)
    |> UI.fill(testid: UI.testid(["edit-title", name]), with: new_name)
    |> UI.select_day_in_date_field(testid: UI.testid(["edit-due-date", name]), date: due_date)
    |> UI.click_button("Save")
    |> UI.refute_has(testid: UI.testid(["edit-form", name]))
  end

  step :leave_a_comment, ctx, comment do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(comment)
    |> UI.click(testid: "post-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_visible_in_feed, ctx, comment do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
  end

  step :assert_comment_email_sent_to_project_reviewer, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "commented on the #{ctx.milestone.title} milestone",
      author: ctx.champion,
    })
  end

  step :assert_comment_notification_sent_to_project_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "commented on #{ctx.milestone.title}"
    })
  end

  step :assert_project_milestones_zero_state, ctx do
    ctx
    |> UI.assert_text("No milestones yet")
    |> UI.assert_text("Add milestones to track key deliverables and deadlines")
  end

  step :assert_add_milestone_form_closed, ctx do
    UI.refute_has(ctx, testid: "add-milestone-form")
  end

  step :assert_milestone_created, ctx, name: name do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
    end)
  end

  step :assert_milestone_created, ctx, name: name, due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
      UI.assert_text(el, due_date)
    end)
  end

  step :assert_milestone_updated, ctx, name: name, due_date: due_date do
    ctx
    |> UI.find(UI.query(testid: "timeline-section"), fn el ->
      UI.assert_text(el, name)
      UI.assert_text(el, due_date)
    end)
  end
end
