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
    |> Steps.assert_feed_item_is_posted()
    |> Steps.assert_notification_is_sent()
    |> Steps.assert_email_is_sent()
  end

  feature "adding a project milestone", ctx do
    ctx
    |> Steps.given_a_project_with_a_defined_timeline_exists()
    |> Steps.when_I_add_a_milestone()
    |> Steps.assert_the_milestone_is_visible_on_the_project_page()
    |> Steps.assert_feed_email_and_notification_are_sent_for_milestone_addition()
  end

  feature "removing a project milestone", ctx do
    ctx
    |> Steps.given_a_project_with_set_milestones_exists()
    |> Steps.when_i_remove_a_milestone()
    |> Steps.assert_the_milestone_is_not_visible_on_the_project_page()
    |> Steps.assert_feed_email_and_notification_are_sent_for_milestone_removal()
  end

  # feature "editing newly added milestones while editing project timeline", ctx do
  #   ctx
  #   |> Steps.start_adding_milestones()
  #   |> Steps.set_project_timeframe()
  #   |> Steps.add_milestone(%{title: "Contract Signed", due_day: 15})
  #   |> Steps.assert_milestone_present("Contract Signed")
  #   |> Steps.edit_milestone(%{
  #     id: "contract-signed",
  #     title: "Contract Updated with Provider",
  #     due_day: 16
  #   })
  #   |> Steps.assert_milestone_not_present("Contract Signed")
  #   |> Steps.assert_milestone_present("Contract Updated with Provider")
  # end

  # feature "editing existing milestones while editing project timeline", ctx do
  #   messages = [
  #     "Updated a milestone:",
  #     "Contract Updated with Provider",
  #     "#{Operately.Time.current_month()} 16th",
  #   ]

  #   ctx
  #   |> Steps.give_a_milestone_exists(%{title: "Contract Signed"})
  #   |> Steps.start_editing_timeline()
  #   |> Steps.set_project_timeframe()
  #   |> Steps.edit_milestone(%{
  #     id: "contract-signed",
  #     title: "Contract Updated with Provider",
  #     due_day: 16
  #   })
  #   |> Steps.submit_changes()
  #   |> Steps.assert_project_timeframe(%{start: "10th", due_day: "20th"})
  #   |> Steps.assert_project_timeline_edited_feed(%{messages: messages})
  #   |> Steps.assert_project_timeline_edited_space_feed_posted(%{messages: messages})
  #   |> Steps.assert_project_timeline_edited_company_feed_posted(%{messages: messages})
  #   |> Steps.assert_project_timeline_edited_notification()
  #   |> Steps.assert_project_timeline_edited_email()
  # end

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
