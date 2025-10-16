defmodule Operately.Data.Change068UpdateProjectTimelineEditedActivityTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change068UpdateProjectTimelineEditedActivity

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "updates utc_datetime fields to date fields in project_timeline_edited activities", ctx do
    activity = create_test_activity(ctx.creator)

    Change068UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["old_start_date"] == "2023-01-01"
    assert updated_activity.content["new_start_date"] == "2023-02-01"
    assert updated_activity.content["old_end_date"] == "2023-06-30"
    assert updated_activity.content["new_end_date"] == "2023-07-31"
  end

  test "handles nil values correctly", ctx do
    activity = create_test_activity_with_nils(ctx.creator)

    Change068UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["old_start_date"] == "2023-01-01"
    assert updated_activity.content["new_start_date"] == nil
    assert updated_activity.content["old_end_date"] == nil
    assert updated_activity.content["new_end_date"] == "2023-07-31"
  end

  test "doesn't change other values", ctx do
    activity = create_test_activity(ctx.creator)

    Change068UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert activity.content["project_id"] == updated_activity.content["project_id"]
    assert activity.content["company_id"] == updated_activity.content["company_id"]
    assert activity.content["space_id"] == updated_activity.content["space_id"]
  end

  defp create_test_activity(person) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "project_timeline_edited",
        author_id: person.id,
        content: %{
          "project_id" => Ecto.UUID.generate(),
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "old_start_date" => "2023-01-01T12:00:00Z",
          "new_start_date" => "2023-02-01T12:00:00Z",
          "old_end_date" => "2023-06-30T12:00:00Z",
          "new_end_date" => "2023-07-31T12:00:00Z",
          "milestone_updates" => [],
          "new_milestones" => []
        }
      })

    activity
  end

  defp create_test_activity_with_nils(person) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "project_timeline_edited",
        author_id: person.id,
        content: %{
          "project_id" => Ecto.UUID.generate(),
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "old_start_date" => "2023-01-01T12:00:00Z",
          "new_start_date" => nil,
          "old_end_date" => nil,
          "new_end_date" => "2023-07-31T12:00:00Z",
          "milestone_updates" => [],
          "new_milestones" => []
        }
      })

    activity
  end
end
