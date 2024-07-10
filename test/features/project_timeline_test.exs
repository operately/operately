defmodule Operately.Features.ProjectsTimelineTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTimelineSteps, as: Steps

  setup ctx do
    Steps.setup(ctx)
  end

  @tag login_as: :champion
  feature "setting initial start and due dates, and adding milestones", ctx do
    ctx
    |> Steps.start_adding_milestones()
    |> Steps.set_project_timeframe()
    |> Steps.add_milestone(%{title: "Contract Signed", due_day: 15})
    |> Steps.add_milestone(%{title: "Website Launched", due_day: 16})
    |> Steps.submit_changes()
    |> Steps.assert_project_timeline_edited_feed(%{
      messages: [
        "The due date was set to #{Operately.Time.current_month()} 20th.",
        "Total project duration is 10 days.",
        "Added new milestones:",
        "Contract Signed",
        "#{Operately.Time.current_month()} 15th",
        "Website Launched",
        "#{Operately.Time.current_month()} 16th"
      ]
    })
    |> Steps.assert_project_timeline_edited_notification()
    |> Steps.assert_project_timeline_edited_email()
  end

  @tag login_as: :champion
  feature "adding and removing new milestones while editing project timeline", ctx do
    ctx
    |> Steps.start_adding_milestones()
    |> Steps.set_project_timeframe()
    |> Steps.add_milestone(%{title: "Contract Signed", due_day: 15})
    |> Steps.remove_milestone(%{id: "contract-signed"})
    |> Steps.assert_milestone_not_present("Contract Signed")
  end

  @tag login_as: :champion
  feature "editing newly added milestones while editing project timeline", ctx do
    ctx
    |> Steps.start_adding_milestones()
    |> Steps.set_project_timeframe()
    |> Steps.add_milestone(%{title: "Contract Signed", due_day: 15})
    |> Steps.assert_milestone_present("Contract Signed")
    |> Steps.edit_milestone(%{
      id: "contract-signed", 
      title: "Contract Updated with Provider", 
      due_day: 16
    })
    |> Steps.assert_milestone_not_present("Contract Signed")
    |> Steps.assert_milestone_present("Contract Updated with Provider")
  end

  @tag login_as: :champion
  feature "editing existing milestones while editing project timeline", ctx do
    ctx
    |> Steps.give_a_milestone_exists(%{title: "Contract Signed"})
    |> Steps.start_editing_timeline()
    |> Steps.set_project_timeframe()
    |> Steps.edit_milestone(%{
      id: "contract-signed", 
      title: "Contract Updated with Provider", 
      due_day: 16
    })
    |> Steps.submit_changes()
    |> Steps.assert_project_timeline_edited_feed(%{
      messages: [
        "Updated a milestone:",
        "Contract Updated with Provider",
        "#{Operately.Time.current_month()} 16th",
      ]
    })
    |> Steps.assert_project_timeline_edited_notification()
    |> Steps.assert_project_timeline_edited_email()
  end
end
