defmodule Operately.Features.ProjectsTimelineTest do
  use Operately.FeatureCase

  alias Operately.Time
  alias Operately.Support.Features.ProjectTimelineSteps, as: Steps

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
    |> Factory.add_space(:product)
  end

  feature "defining the project timeline", ctx do
    params = %{
      started_at: Time.day_in_current_month(10),
      deadline: Time.day_in_current_month(20),
      milestones: [
        %{title: "Contract Signed", due_day: Time.day_in_current_month(15)},
        %{title: "Website Launched", due_day: Time.day_in_current_month(16)}
      ]
    }

    ctx
    |> Steps.given_a_project_exists()
    |> Steps.when_i_define_the_project_timeline(params)
    |> Steps.assert_the_timeline_and_milestone_are_visible_on_the_project_page(params)
    |> Steps.assert_feed_email_and_notification_are_sent_for_timeline_change()
  end

  feature "adding a project milestone", ctx do
    ctx
    |> Steps.given_a_project_with_a_defined_timeline_exists()
    |> Steps.when_i_add_a_milestone()
    |> Steps.assert_the_milestone_is_visible_on_the_project_page()
    |> Steps.assert_feed_email_and_notification_are_sent_for_milestone_addition()
  end

  feature "viewing project progress for an ongoing project", ctx do
    ctx
    |> Steps.given_a_project_with_a_defined_timeline_exists()
    |> Steps.expect_to_see_project_countdown_on_the_project_page()
  end

  feature "viewing project progress for an ongoing (late) project", ctx do
    ctx
    |> Steps.given_an_overdue_project_exists()
    |> Steps.expect_to_see_project_overdue_days_on_the_project_page()
  end

  feature "viewing project progress for a completed project", ctx do
    ctx
    |> Steps.given_a_completed_project_exists()
    |> Steps.expect_to_see_project_closing_date_on_the_project_page()
    |> Steps.expect_to_see_how_many_days_the_project_was_completed_ahead_of_schedule()
  end

  feature "viewing project progress for a closed overdue project", ctx do
    ctx
    |> Steps.given_a_closed_overdue_project_exists()
    |> Steps.expect_to_see_how_many_days_was_the_project_overdue()
  end
end
