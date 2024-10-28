defmodule Operately.Support.Features.ProjectTimelineSteps do
  use Operately.FeatureCase

  alias Operately.Time

  alias Operately.Support.Features.{
    UI,
    EmailSteps,
    NotificationsSteps,
    FeedSteps,
    EmailSteps,
    NotificationsSteps
  }

  step :given_a_project_exists, ctx do
    ctx
    |> Factory.add_project(:project, :product)
    |> Factory.add_project_reviewer(:reviewer, :project)
  end

  step :when_i_define_the_project_timeline, ctx, attrs do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-timeline")
    |> UI.click(testid: "edit-timeline")
    |> UI.click(testid: "project-start")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{attrs.started_at.day}")
    |> UI.click(testid: "project-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{attrs.deadline.day}")
    |> UI.foreach(attrs.milestones, fn milestone, ctx ->
      ctx
      |> UI.click(testid: "add-milestone")
      |> UI.fill(testid: "new-milestone-title", with: milestone.title)
      |> UI.click(testid: "new-milestone-due")
      |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{milestone.due_day.day}")
      |> UI.click(testid: "save-milestone-button")
    end)
    |> UI.click(testid: "save-changes")
    |> UI.assert_has(testid: "project-timeline-page")
  end

  step :assert_the_timeline_and_milestone_are_visible_on_the_project_page, ctx, attrs do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(Time.short_date(attrs.started_at))
    |> UI.assert_text(Time.short_date(attrs.deadline))
    |> UI.foreach(attrs.milestones, fn milestone, ctx ->
      ctx
      |> UI.assert_text(milestone.title)
      |> UI.assert_text(Time.short_date(milestone.due_day))
    end)
  end

  step :assert_feed_email_and_notification_are_sent_for_timeline_change, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline"
    })
    |> UI.visit(Paths.space_path(ctx.company, ctx.product))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline on the #{ctx.project.name} project"
    })
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline on the #{ctx.project.name} project"
    })
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: find_person(ctx.reviewer),
      author: ctx.creator,
      action: "edited the timeline"
    })
    |> Factory.log_in_contributor(:reviewer)
    |> NotificationsSteps.assert_notification_exists(
      author: ctx.creator,
      subject: "#{Operately.People.Person.first_name(ctx.creator)} changed the project timeline"
    )
  end

  step :when_i_add_a_milestone, ctx do
    current_day = Date.utc_today().day

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-timeline")
    |> UI.click(testid: "edit-timeline")
    |> UI.click(testid: "add-milestone")
    |> UI.fill(testid: "new-milestone-title", with: "Website Published")
    |> UI.click(testid: "new-milestone-due")
    |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{current_day}")
    |> UI.click(testid: "save-milestone-button")
    |> UI.click(testid: "save-changes")
    |> UI.assert_has(testid: "project-timeline-page")
  end

  step :assert_the_milestone_is_visible_on_the_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("Website Published")
  end

  step :assert_feed_email_and_notification_are_sent_for_milestone_addition, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline"
    })
    |> UI.visit(Paths.space_path(ctx.company, ctx.product))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline on the #{ctx.project.name} project"
    })
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.creator,
      title: "edited the timeline on the #{ctx.project.name} project"
    })
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: find_person(ctx.reviewer),
      author: ctx.creator,
      action: "edited the timeline"
    })
    |> Factory.log_in_contributor(:reviewer)
    |> NotificationsSteps.assert_notification_exists(
      author: ctx.creator,
      subject: "#{Operately.People.Person.first_name(ctx.creator)} changed the project timeline"
    )
  end

  # step :set_project_timeframe, ctx do
  #   ctx
  #   |> choose_day(field: "project-start", day: 10)
  #   |> choose_day(field: "project-due", day: 20)
  # end

  # step :add_milestone, ctx, attrs do
  #   ctx
  #   |> UI.click(testid: "add-milestone")
  #   |> UI.fill(testid: "new-milestone-title", with: attrs.title)
  #   |> UI.click(testid: "new-milestone-due")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{attrs.due_day}")
  #   |> UI.click(testid: "save-milestone-button")
  #   |> UI.assert_text("Deadline: #{current_month(:short)} #{attrs.due_day}")
  #   |> UI.assert_text("Save Changes")
  # end

  # step :edit_milestone, ctx, %{id: id, title: title, due_day: due_day} do
  #   ctx
  #   |> UI.click(testid: "edit-milestone-#{id}")
  #   |> UI.sleep(100) # wait for the modal to open
  #   |> UI.fill(testid: "new-milestone-title", with: title)
  #   |> UI.click(testid: "new-milestone-due")
  #   |> UI.click(css: ".react-datepicker__day.react-datepicker__day--0#{due_day}")
  #   |> UI.click(testid: "save-milestone-button")
  #   |> UI.assert_text("Deadline: #{current_month(:short)} #{due_day}")
  #   |> UI.assert_text("Save Changes")
  #   |> UI.sleep(300) # wait for the modal to close
  # end

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

  step :given_a_project_with_a_defined_timeline_exists, ctx do
    Factory.add_project(ctx, :project, :product, [
      started_at: Time.days_ago(15),
      deadline: Time.days_from_now(10)
    ])
    |> Factory.add_project_reviewer(:reviewer, :project)
  end

  step :given_a_project_with_a_defined_timeline_and_milestones_exists, ctx do
    Factory.add_project(ctx, :project, :product, [
      started_at: Time.days_ago(15),
      deadline: Time.days_from_now(10)
    ])
    |> Factory.add_project_reviewer(:reviewer, :project)
    |> Factory.add_project_milestone(:milestone1, :project, [
      title: "Contract Signed",
      due_day: Time.days_from_now(5)
    ])
    |> Factory.add_project_milestone(:milestone2, :project, [
      title: "Website Launched",
      due_day: Time.days_from_now(6)
    ])
  end

  step :when_i_remove_a_milestone, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "manage-timeline")
    |> UI.click(testid: "edit-timeline")
    |> UI.click(testid: "edit-milestone-contract-signed")
    |> UI.click(testid: "save-changes")
    |> UI.assert_has(testid: "project-timeline-page")
  end

  step :expect_to_see_project_countdown_on_the_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("10 days remaining")
  end

  step :given_an_overdue_project_exists, ctx do
    Factory.add_project(ctx, :project, :product, [
      started_at: Time.days_ago(15),
      deadline: Time.days_ago(5)
    ])
  end

  step :expect_to_see_project_overdue_days_on_the_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("4 days overdue")
  end

  step :given_a_completed_project_exists, ctx do
    ctx = Factory.add_project(ctx, :project, :product, [
      started_at: Time.days_ago(15),
      deadline: Time.days_ago(5)
    ])

    ctx = close_project(ctx, ctx.project, Time.days_ago(10))
    ctx
  end

  step :expect_to_see_project_closing_date_on_the_project_page, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("COMPLETED ON")
    |> UI.assert_text(Time.short_date(ctx.project.closed_at))
  end

  step :expect_to_see_how_many_days_the_project_was_completed_ahead_of_schedule, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("5 days ahead of schedule")
  end

  step :given_a_closed_overdue_project_exists, ctx do
    ctx = Factory.add_project(ctx, :project, :product, [started_at: Time.days_ago(15), deadline: Time.days_ago(5)])
    ctx = close_project(ctx, ctx.project, Time.days_ago(0))
    ctx
  end

  step :expect_to_see_how_many_days_was_the_project_overdue, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("5 days late")
  end


  defp close_project(ctx, project, date) do
    {:ok, project} = Operately.Projects.update_project(project, %{closed_at: date, status: "closed"})
    Map.put(ctx, :project, project)
  end

  defp find_person(%Operately.Projects.Contributor{} = contributor) do
    Operately.People.get_person(contributor.person_id)
  end

end
