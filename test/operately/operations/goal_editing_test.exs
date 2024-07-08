defmodule Operately.Operations.GoalEditingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Goals
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    goal = goal_fixture(creator, %{
      name: "some name",
      space_id: space.id,
      champion_id: creator.id,
      reviewer_id: creator.id,
      targets: [
        %{
          name: "Some target",
          from: 80,
          to: 90,
          unit: "percent",
          index: 0
        }
      ],
    })

    attrs = %{
      name: "new name",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
      added_targets: [ %{ name: "new target", from: 30, to: 15, unit: "minutes", index: 1 } ],
      updated_targets: [],
    }

    {:ok, attrs: attrs, company: company, space: space, goal: goal, creator: creator, champion: champion, reviewer: reviewer}
  end

  test "GoalEditing operation edits goal", ctx do
    assert ctx.goal.name == "some name"
    assert ctx.goal.champion_id == ctx.creator.id
    assert ctx.goal.reviewer_id == ctx.creator.id

    targets = Goals.list_targets(ctx.goal.id)
    target = hd(targets)

    assert length(targets) == 1
    assert target.name == "Some target"

    attrs = Map.merge(ctx.attrs, %{updated_targets: [ %{ id: target.id, name: "updated target" } ]})

    {:ok, goal} = Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, attrs)

    target = Repo.reload(target)

    assert goal.name == "new name"
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert length(Goals.list_targets(goal.id)) == 2
    assert target.name == "updated target"
  end

  test "GoalEditing operation creates activity and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, ctx.attrs)
    end)

    activity = from(a in Activity, where: a.action == "goal_editing" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 2 == notifications_count() # 1 reviewer + 1 champion = 2
    assert fetch_notifications(activity.id)
  end
end
