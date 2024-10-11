defmodule Operately.Data.Change038AddSpaceToGoalEditingActivityTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  test "migration doesn't delete existing data in activity content", ctx do
    attrs = %{
      name: "Edited name",
      description: RichText.rich_text("content", :as_string),
      added_targets: [%{index: 0, name: "Added Target", unit: "New Unit", to: 30, from: 0}],
      updated_targets: [],
      goal_id: ctx.goal.id,
      champion_id: ctx.creator.id,
      reviewer_id: ctx.creator.id,
      timeframe: %{type: "days", start_date: ~D[2024-10-01], end_date: ~D[2025-02-28]},
      anonymous_access_level: 0,
      company_access_level: 0,
      space_access_level: 0
    }

    Enum.each(1..3, fn _ ->
      {:ok, _} = Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, attrs)
    end)

    Operately.Data.Change038AddSpaceToGoalEditingActivity.run()

    fetch_activities("goal_editing")
    |> Enum.each(fn activity ->
      added_targets = activity.content["added_targets"]
      assert length(added_targets) == 1
      assert hd(added_targets)["name"] == "Added Target"
      assert hd(added_targets)["unit"] == "New Unit"

      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.space.id
      assert activity.content["goal_id"] == ctx.goal.id

      current_timeframe = activity.content["current_timeframe"]
      assert current_timeframe["start_date"] == "2024-10-01"
      assert current_timeframe["end_date"] == "2025-02-28"

      assert activity.content["new_name"] == "Edited name"
      assert activity.content["new_champion_id"] == ctx.creator.id
      assert activity.content["new_reviewer_id"] == ctx.creator.id
    end)
  end

  #
  # Helpers
  #

  defp fetch_activities(action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action
    )
    |> Repo.all()
  end
end
