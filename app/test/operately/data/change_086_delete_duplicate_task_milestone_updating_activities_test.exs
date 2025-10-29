defmodule Operately.Data.Change086DeleteDuplicateTaskMilestoneUpdatingActivitiesTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Data.Change086DeleteDuplicateTaskMilestoneUpdatingActivities

  setup ctx do
    Factory.setup(ctx)
  end

  test "deletes activities where milestone ids are the same", ctx do
    duplicate_id = Ecto.UUID.generate()

    duplicate_with_string_keys = create_activity(ctx.creator.id, %{
      "old_milestone_id" => duplicate_id,
      "new_milestone_id" => duplicate_id
    })

    duplicate_with_atom_keys = create_activity(ctx.creator.id, %{
      old_milestone_id: duplicate_id,
      new_milestone_id: duplicate_id
    })

    kept_activity = create_activity(ctx.creator.id, %{
      "old_milestone_id" => duplicate_id,
      "new_milestone_id" => Ecto.UUID.generate()
    })

    Change086DeleteDuplicateTaskMilestoneUpdatingActivities.run()

    refute Repo.get(Activity, duplicate_with_string_keys.id)
    refute Repo.get(Activity, duplicate_with_atom_keys.id)
    assert Repo.get(Activity, kept_activity.id)
  end

  test "keeps activities without complete milestone data", ctx do
    different_ids = create_activity(ctx.creator.id, %{
      "old_milestone_id" => Ecto.UUID.generate(),
      "new_milestone_id" => Ecto.UUID.generate()
    })

    missing_new = create_activity(ctx.creator.id, %{
      "old_milestone_id" => Ecto.UUID.generate()
    })

    missing_old = create_activity(ctx.creator.id, %{
      "new_milestone_id" => Ecto.UUID.generate()
    })

    both_nil = create_activity(ctx.creator.id, %{})

    Change086DeleteDuplicateTaskMilestoneUpdatingActivities.run()

    assert Repo.get(Activity, different_ids.id)
    assert Repo.get(Activity, missing_new.id)
    assert Repo.get(Activity, missing_old.id)
    assert Repo.get(Activity, both_nil.id)
  end

  defp create_activity(author_id, content_overrides) do
    base_content = %{
      "company_id" => Ecto.UUID.generate(),
      "space_id" => Ecto.UUID.generate(),
      "project_id" => Ecto.UUID.generate(),
      "task_id" => Ecto.UUID.generate()
    }

    Repo.insert!(%Activity{
      action: "task_milestone_updating",
      author_id: author_id,
      content: Map.merge(base_content, content_overrides)
    })
  end
end
