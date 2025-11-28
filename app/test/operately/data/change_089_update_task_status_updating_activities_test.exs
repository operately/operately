defmodule Operately.Data.Change089UpdateTaskStatusUpdatingActivitiesTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Data.Change089UpdateTaskStatusUpdatingActivities
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "converts string statuses to embedded maps", ctx do
    activity =
      create_activity(ctx.creator.id, %{
        "old_status" => "pending",
        "new_status" => "completed"
      })

    Change089UpdateTaskStatusUpdatingActivities.run()

    reloaded = Repo.get!(Activity, activity.id)
    old_status = reloaded.content["old_status"]
    new_status = reloaded.content["new_status"]

    assert old_status["value"] == "pending"
    assert old_status["label"] == "Pending"
    assert old_status["closed"] == false

    assert new_status["value"] == "completed"
    assert new_status["label"] == "Completed"
    assert new_status["closed"] == true
  end

  test "keeps activities that already have status maps", ctx do
    activity =
      create_activity(ctx.creator.id, %{
        "old_status" => %{
          "id" => Ecto.UUID.generate(),
          "label" => "Pending",
          "color" => "gray",
          "value" => "pending",
          "index" => 0,
          "closed" => false
        },
        "new_status" => %{
          "id" => Ecto.UUID.generate(),
          "label" => "Done",
          "color" => "green",
          "value" => "done",
          "index" => 1,
          "closed" => true
        }
      })

    Change089UpdateTaskStatusUpdatingActivities.run()

    reloaded = Repo.get!(Activity, activity.id)

    assert reloaded.content["old_status"]["value"] == "pending"
    assert reloaded.content["new_status"]["value"] == "done"
  end

  test "deletes activities with nil or missing statuses", ctx do
    with_nil_old =
      create_activity(ctx.creator.id, %{
        "old_status" => nil,
        "new_status" => "pending"
      })

    with_nil_new =
      create_activity(ctx.creator.id, %{
        "old_status" => "pending",
        "new_status" => nil
      })

    with_missing_old =
      create_activity(ctx.creator.id, %{
        "new_status" => "pending"
      })

    with_missing_new =
      create_activity(ctx.creator.id, %{
        "old_status" => "pending"
      })

    kept =
      create_activity(ctx.creator.id, %{
        "old_status" => "pending",
        "new_status" => "done"
      })

    Change089UpdateTaskStatusUpdatingActivities.run()

    refute Repo.get(Activity, with_nil_old.id)
    refute Repo.get(Activity, with_nil_new.id)
    refute Repo.get(Activity, with_missing_old.id)
    refute Repo.get(Activity, with_missing_new.id)

    assert Repo.get(Activity, kept.id)
  end

  defp create_activity(author_id, content_overrides) do
    base_content = %{
      "company_id" => Ecto.UUID.generate(),
      "space_id" => Ecto.UUID.generate(),
      "project_id" => Ecto.UUID.generate(),
      "task_id" => Ecto.UUID.generate()
    }

    Repo.insert!(%Activity{
      action: "task_status_updating",
      author_id: author_id,
      content: Map.merge(base_content, content_overrides)
    })
  end
end
