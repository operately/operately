defmodule Operately.Features.ProjectsTimelineTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "edit project timeline", ctx do
    ctx
    |> ProjectSteps.add_milestone(%{title: "Contract Signed", deadline_at: day_in_current_month(20)})
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-project-timeline")
    |> UI.click(testid: "planning-start")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--010")
    |> UI.click(testid: "planning-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--011")
    |> UI.click(testid: "execution-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
    |> UI.click(testid: "control-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
    |> UI.click(testid: "milestone-contract-signed-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--012")
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "new-milestone-title", with: "Website Launched")
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--013")
    |> UI.click(testid: "add-milestone-button")
    |> UI.click(testid: "save")

    :timer.sleep(200)

    project = Operately.Projects.get_project!(ctx.project.id)
    phases = Operately.Projects.list_project_phase_history(project)
    planning = Enum.find(phases, fn phase -> phase.phase == :planning end)
    execution = Enum.find(phases, fn phase -> phase.phase == :execution end)
    control = Enum.find(phases, fn phase -> phase.phase == :control end)

    assert project.started_at == day_in_current_month(10)
    assert project.deadline == day_in_current_month(13)

    assert planning.start_time == day_in_current_month(10)
    assert planning.due_time == day_in_current_month(11)
    assert execution.start_time == day_in_current_month(11)
    assert execution.due_time == day_in_current_month(12)
    assert control.start_time == day_in_current_month(12)
    assert control.due_time == day_in_current_month(13)

    milestones = Operately.Projects.list_project_milestones(project)
    contract = Enum.find(milestones, fn milestone -> milestone.title == "Contract Signed" end)
    website = Enum.find(milestones, fn milestone -> milestone.title == "Website Launched" end)

    assert DateTime.from_naive!(contract.deadline_at, "Etc/UTC") == day_in_current_month(12)
    assert DateTime.from_naive!(website.deadline_at, "Etc/UTC") == day_in_current_month(13)

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_timeline_edited_sent(author: ctx.champion)
    |> EmailSteps.assert_project_timeline_edited_sent(author: ctx.champion, to: ctx.reviewer)
  end

  #
  # ======== Helper functions ========
  #

  defp day_in_current_month(day) do
    today = Date.utc_today()

    {:ok, date} = Date.from_erl({today.year, today.month, day})
    {:ok, date} = NaiveDateTime.new(date, ~T[00:00:00])

    DateTime.from_naive!(date, "Etc/UTC")
  end

end
