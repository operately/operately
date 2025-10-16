defmodule Operately.Data.Change070UpdateProjectTimelineEditedActivityTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Data.Change070UpdateProjectTimelineEditedActivity

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "updates utc_datetime fields to date fields in milestone_updates", ctx do
    activity = create_test_activity_with_milestone_updates(ctx.creator)

    Change070UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)
    milestone_updates = updated_activity.content["milestone_updates"]

    assert length(milestone_updates) == 2

    [update1, update2] = milestone_updates
    assert update1["old_due_date"] == "2023-03-15"
    assert update1["new_due_date"] == "2023-04-15"
    assert update2["old_due_date"] == "2023-05-15"
    assert update2["new_due_date"] == "2023-06-15"
  end

  test "updates utc_datetime fields to date fields in new_milestones", ctx do
    activity = create_test_activity_with_new_milestones(ctx.creator)

    Change070UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)
    new_milestones = updated_activity.content["new_milestones"]

    assert length(new_milestones) == 2

    [milestone1, milestone2] = new_milestones
    assert milestone1["due_date"] == "2023-04-20"
    assert milestone2["due_date"] == "2023-07-20"
  end

  test "handles nil values correctly in embedded structures", ctx do
    activity = create_test_activity_with_nil_values(ctx.creator)

    Change070UpdateProjectTimelineEditedActivity.run()

    updated_activity = Repo.get!(Activity, activity.id)
    milestone_updates = updated_activity.content["milestone_updates"]
    new_milestones = updated_activity.content["new_milestones"]

    [update] = milestone_updates
    [milestone] = new_milestones

    assert update["old_due_date"] == nil
    assert update["new_due_date"] == "2023-06-01"
    assert milestone["due_date"] == nil
  end

  defp create_test_activity_with_milestone_updates(person) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "project_timeline_edited",
        author_id: person.id,
        content: %{
          "project_id" => Ecto.UUID.generate(),
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "milestone_updates" => [
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "old_due_date" => "2023-03-15T12:00:00Z",
              "new_due_date" => "2023-04-15T12:00:00Z",
              "old_title" => "Old Milestone 1",
              "new_title" => "New Milestone 1"
            },
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "old_due_date" => "2023-05-15T12:00:00Z",
              "new_due_date" => "2023-06-15T12:00:00Z",
              "old_title" => "Old Milestone 2",
              "new_title" => "New Milestone 2"
            }
          ],
          "new_milestones" => []
        }
      })

    activity
  end

  defp create_test_activity_with_new_milestones(person) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "project_timeline_edited",
        author_id: person.id,
        content: %{
          "project_id" => Ecto.UUID.generate(),
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "milestone_updates" => [],
          "new_milestones" => [
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "title" => "New Milestone A",
              "due_date" => "2023-04-20T12:00:00Z"
            },
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "title" => "New Milestone B",
              "due_date" => "2023-07-20T12:00:00Z"
            }
          ]
        }
      })

    activity
  end

  defp create_test_activity_with_nil_values(person) do
    {:ok, activity} =
      Repo.insert(%Activity{
        action: "project_timeline_edited",
        author_id: person.id,
        content: %{
          "project_id" => Ecto.UUID.generate(),
          "company_id" => Ecto.UUID.generate(),
          "space_id" => Ecto.UUID.generate(),
          "milestone_updates" => [
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "old_due_date" => nil,
              "new_due_date" => "2023-06-01T12:00:00Z",
              "old_title" => "Some Milestone",
              "new_title" => "Updated Milestone"
            }
          ],
          "new_milestones" => [
            %{
              "milestone_id" => Ecto.UUID.generate(),
              "title" => "Milestone Without Date",
              "due_date" => nil
            }
          ]
        }
      })

    activity
  end
end
