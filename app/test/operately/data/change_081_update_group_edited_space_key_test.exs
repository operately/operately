defmodule Operately.Data.Change081UpdateGroupEditedSpaceKeyTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Data.Change081UpdateGroupEditedSpaceKey

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "renames group_id to space_id while preserving the value", ctx do
    content = %{
      "company_id" => ctx.company.id,
      "group_id" => ctx.space.id,
      "old_name" => "Old Name",
      "old_mission" => "Old Mission",
      "new_name" => "New Name",
      "new_mission" => "New Mission"
    }

    activity =
      Repo.insert!(%Activity{
        action: "group_edited",
        author_id: ctx.creator.id,
        content: content
      })

    Change081UpdateGroupEditedSpaceKey.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["space_id"] == ctx.space.id
    refute Map.has_key?(updated_activity.content, "group_id")
    assert updated_activity.content["old_name"] == content["old_name"]
    assert updated_activity.content["new_name"] == content["new_name"]
    assert updated_activity.content["old_mission"] == content["old_mission"]
    assert updated_activity.content["new_mission"] == content["new_mission"]
  end

  test "keeps activities that already use space_id unchanged", ctx do
    content = %{
      "company_id" => ctx.company.id,
      "space_id" => ctx.space.id,
      "old_name" => "Old Name",
      "old_mission" => "Old Mission",
      "new_name" => "New Name",
      "new_mission" => "New Mission"
    }

    activity =
      Repo.insert!(%Activity{
        action: "group_edited",
        author_id: ctx.creator.id,
        content: content
      })

    Change081UpdateGroupEditedSpaceKey.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content == content
  end
end
