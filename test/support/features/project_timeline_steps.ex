defmodule Operately.Support.Features.ProjectTimelineSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.{
    UI, 
    EmailSteps, 
    NotificationsSteps,
    ProjectSteps,
    FeedSteps,
    EmailSteps,
    NotificationsSteps
  }

  step :setup, ctx do
    ctx
    |> ProjectSteps.create_project(name: "Test Project")
    |> ProjectSteps.login()
  end

  step :give_a_milestone_exists, ctx, %{title: title} do
    date = {{Date.utc_today().year, Date.utc_today().month, 15}, {0, 0, 0}}

    {:ok, _} = Operately.Projects.create_milestone(ctx.champion, %{
      project_id: ctx.project.id,
      title: title,
      deadline_at: NaiveDateTime.from_erl!(date)
    })

    ctx
  end

  step :start_editing_timeline, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-timeline")
    |> UI.click(testid: "edit-timeline")
  end
  
  step :start_adding_milestones, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "add-milestones-link")
  end

  step :set_project_timeframe, ctx do
    ctx
    |> choose_day(field: "project-start", day: 10)
    |> choose_day(field: "project-due", day: 20)
  end

  step :add_milestone, ctx, attrs do
    ctx
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "new-milestone-title", with: attrs.title)
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{attrs.due_day}")
    |> UI.click(testid: "save-milestone-button")
    |> UI.assert_text("Save Changes")
  end

  step :remove_milestone, ctx, %{id: id} do
    ctx
    |> UI.click(testid: "remove-milestone-#{id}")
  end

  step :edit_milestone, ctx, %{id: id, title: title, due_day: due_day} do
    ctx
    |> UI.click(testid: "edit-milestone-#{id}")
    |> UI.sleep(100) # wait for the modal to open
    |> UI.fill(testid: "new-milestone-title", with: title)
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{due_day}")
    |> UI.click(testid: "save-milestone-button")
    |> UI.assert_text("Save Changes")
    |> UI.sleep(300) # wait for the modal to close
  end

  step :submit_changes, ctx do
    ctx
    |> UI.click(testid: "save-changes")
    |> UI.sleep(300)
  end

  step :assert_project_timeline_edited_feed, ctx, %{messages: messages} do
    ctx
    |> ProjectSteps.visit_project_page()
    |> FeedSteps.assert_project_timeline_edited(author: ctx.champion, messages: messages)
  end

  step :assert_project_timeline_edited_notification, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
  end

  step :assert_project_timeline_edited_email, ctx do  
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "edited the timeline"
    })
  end

  step :assert_milestone_present, ctx, title do
    ctx |> UI.assert_text(title)
  end

  step :assert_milestone_not_present, ctx, title do
    ctx |> UI.refute_text(title)
  end

  defp choose_day(ctx, field: field, day: day) do
    ctx
    |> UI.click(testid: field)
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{day}")
  end
end
