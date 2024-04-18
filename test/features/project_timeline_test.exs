defmodule Operately.Features.ProjectsTimelineTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "setting initial start and due dates, and adding milestones", ctx do
    ctx
    |> visit_page()
    |> choose_day(field: "project-start", day: 10)
    |> choose_day(field: "project-due", day: 20)
    |> add_milestone(title: "Contract Signed", due_day: 15)
    |> add_milestone(title: "Website Launched", due_day: 16)
    |> UI.click(testid: "save-changes")

    ctx
    |> ProjectSteps.visit_project_page()
    |> FeedSteps.assert_project_timeline_edited(
      author: ctx.champion, 
      messages: [
        "The due date was set to #{Operately.Time.current_month()} 20th.",
        "Total project duration is 10 days.",
        "Added new milestones:",
        "Contract Signed",
        "#{Operately.Time.current_month()} 15th",
        "Website Launched",
        "#{Operately.Time.current_month()} 16th"
      ]
    )
    
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

  @tag login_as: :champion
  feature "adding and removing new milestones while editing project timeline", ctx do
    ctx
    |> visit_page()
    |> choose_day(field: "project-start", day: 10)
    |> choose_day(field: "project-due", day: 20)
    |> add_milestone(title: "Contract Signed", due_day: 15)
    |> UI.assert_text("Contract Signed")
    |> remove_milestone(title: "contract-signed")
    |> UI.refute_text("Contract Signed")
  end

  @tag login_as: :champion
  feature "editing newly added milestones while editing project timeline", ctx do
    ctx
    |> visit_page()
    |> choose_day(field: "project-start", day: 10)
    |> choose_day(field: "project-due", day: 20)
    |> add_milestone(title: "Contract Signed", due_day: 15)
    |> UI.assert_text("Contract Signed")
    |> edit_milestone("contract-signed", "Contract Updated with Provider", 16)
    |> UI.refute_text("Contract Signed")
    |> UI.assert_text("Contract Updated with Provider")
  end

  @tag login_as: :champion
  feature "editing existing milestones while editing project timeline", ctx do
    date = {{Date.utc_today().year, Date.utc_today().month, 15}, {0, 0, 0}}

    {:ok, _} = Operately.Projects.create_milestone(ctx.champion, %{
      project_id: ctx.project.id,
      title: "Contract Signed",
      deadline_at: NaiveDateTime.from_erl!(date)
    })

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "manage-timeline")
    |> UI.click(testid: "edit-timeline")
    |> choose_day(field: "project-start", day: 10)
    |> choose_day(field: "project-due", day: 20)
    |> edit_milestone("contract-signed", "Contract Updated with Provider", 16)
    |> UI.click(testid: "save-changes")

    ctx
    |> ProjectSteps.visit_project_page()
    |> FeedSteps.assert_project_timeline_edited(
      author: ctx.champion, 
      messages: [
        "Updated a milestone:",
        "Contract Updated with Provider",
        "#{Operately.Time.current_month()} 16th",
      ]
    )

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

  #
  # ======== Helper functions ========
  #

  defp visit_page(ctx) do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "add-milestones-link")
  end

  defp choose_day(ctx, field: field, day: day) do
    ctx
    |> UI.click(testid: field)
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{day}")
  end

  defp add_milestone(ctx, attrs) do
    attrs = Enum.into(attrs, %{})

    ctx
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "new-milestone-title", with: attrs.title)
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{attrs.due_day}")
    |> UI.click(testid: "save-milestone-button")
    |> UI.assert_text("Save Changes")
  end

  defp remove_milestone(ctx, title: title) do
    ctx
    |> UI.click(testid: "remove-milestone-#{title}")
  end

  defp edit_milestone(ctx, selector, title, due_day) do
    ctx
    |> UI.click(testid: "edit-milestone-#{selector}")
    |> UI.sleep(100) # wait for the modal to open
    |> UI.fill(testid: "new-milestone-title", with: title)
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{due_day}")
    |> UI.click(testid: "save-milestone-button")
    |> UI.assert_text("Save Changes")
  end
end
