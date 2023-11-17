defmodule Operately.Features.ProjectsTimelineTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectFeedSteps
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
    |> UI.click(testid: "save")
    |> ProjectFeedSteps.assert_project_timeline_edited(
      author: ctx.champion, 
      messages: [
        "The due date was set to #{Operately.Time.current_month()} 20th.",
        "Total project duration is 10 days.",
        "Added a milestone:",
        "Contract Signed - #{Operately.Time.current_month()} 15th"
      ]
    )
    
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
    |> EmailSteps.assert_project_timeline_edited_sent(author: ctx.champion, to: ctx.reviewer)
  end

  # @tag login_as: :champion
  # feature "edit project timeline", ctx do
  #   ctx
  #   |> ProjectSteps.add_milestone(%{title: "Contract Signed", deadline_at: day_in_current_month(20)})
  #   |> visit_page()
  #   |> choose_day(field: "project-start", day: 10)
  #   |> choose_day(field: "project-due", day: 20)
  #   # |> UI.click(testid: "milestone-contract-signed-due")
  #   # |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
  #   # |> UI.click(testid: "add-milestone")
  #   # |> UI.fill(testid: "new-milestone-title", with: "Website Launched")
  #   # |> UI.click(testid: "new-milestone-due")
  #   # |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
  #   # |> UI.click(testid: "add-milestone-button")
  #   # |> UI.click(testid: "save")

  #   # :timer.sleep(200)

  #   # project = Operately.Projects.get_project!(ctx.project.id)

  #   # assert project.started_at == day_in_current_month(10)
  #   # assert project.deadline == day_in_current_month(20)

  #   # milestones = Operately.Projects.list_project_milestones(project)
  #   # contract = Enum.find(milestones, fn milestone -> milestone.title == "Contract Signed" end)
  #   # website = Enum.find(milestones, fn milestone -> milestone.title == "Website Launched" end)

  #   # assert DateTime.from_naive!(contract.deadline_at, "Etc/UTC") == day_in_current_month(12)
  #   # assert DateTime.from_naive!(website.deadline_at, "Etc/UTC") == day_in_current_month(13)

  #   # ctx
  #   # |> UI.login_as(ctx.reviewer)
  #   # |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
  #   # |> EmailSteps.assert_project_timeline_edited_sent(author: ctx.champion, to: ctx.reviewer)
  # end

  #
  # ======== Helper functions ========
  #

  defp visit_page(ctx) do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-project-timeline")
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
    |> UI.click(testid: "add-milestone-button")
  end
end
