defmodule Operately.Data.Change082PopulateGoalDescriptionChangedActivityGoalNameTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Data.Change082PopulateGoalDescriptionChangedActivityGoalName
  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space, name: "Test Goal")
  end

  test "adds goal_name when the goal exists", ctx do
    activity = create_activity(ctx.creator, ctx.goal.id)

    Change082PopulateGoalDescriptionChangedActivityGoalName.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["goal_name"] == ctx.goal.name
  end

  test "does not change activities that already have goal_name", ctx do
    content = %{
      "company_id" => ctx.company.id,
      "space_id" => ctx.space.id,
      "goal_id" => ctx.goal.id,
      "goal_name" => "Existing",
      "old_description" => %{"type" => "doc", "content" => []},
      "new_description" => %{"type" => "doc", "content" => []},
      "has_description" => true
    }

    activity = Repo.insert!(%Activity{
      action: "goal_description_changed",
      author_id: ctx.creator.id,
      content: content
    })

    Change082PopulateGoalDescriptionChangedActivityGoalName.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content == content
  end

  test "sets goal_name to nil when the goal is missing", ctx do
    activity = create_activity(ctx.creator, Ecto.UUID.generate())

    Change082PopulateGoalDescriptionChangedActivityGoalName.run()

    updated_activity = Repo.get!(Activity, activity.id)

    assert updated_activity.content["goal_name"] == nil
  end

  defp create_activity(author, goal_id) do
    Repo.insert!(%Activity{
      action: "goal_description_changed",
      author_id: author.id,
      content: %{
        "company_id" => Ecto.UUID.generate(),
        "space_id" => Ecto.UUID.generate(),
        "goal_id" => goal_id,
        "old_description" => %{"type" => "doc", "content" => []},
        "new_description" => %{"type" => "doc", "content" => []},
        "has_description" => true
      }
    })
  end
end

