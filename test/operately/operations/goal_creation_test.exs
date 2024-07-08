defmodule Operately.Operations.GoalCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Goals
  alias Operately.Activities.Activity

  @target_attrs %{ name: "First response time", from: 30, to: 15, unit: "minutes", index: 0 }

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    attrs = %{
      space_id: space.id,
      name: "some name",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
      targets: [ @target_attrs ],
    }

    {:ok, attrs: attrs, creator: creator}
  end

  test "GoalCreation operation creates goal and context", ctx do
    assert Goals.list_goals() == []

    {:ok, goal} = Operately.Operations.GoalCreation.run(ctx.creator, ctx.attrs)

    assert Goals.list_goals() == [goal]
    assert Access.get_context(goal_id: goal.id)
  end

  test "GoalCreation operation creates targets", ctx do
    {:ok, goal} = Operately.Operations.GoalCreation.run(ctx.creator, ctx.attrs)

    targets = Goals.list_targets(goal.id)

    assert length(targets) == 1

    target = hd(targets)

    assert target.name == @target_attrs[:name]
    assert target.from == @target_attrs[:from]
    assert target.to == @target_attrs[:to]
    assert target.unit == @target_attrs[:unit]
    assert target.index == @target_attrs[:index]
  end

  test "GoalCreation operation creates activity and notification", ctx do
    {:ok, goal} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalCreation.run(ctx.creator, ctx.attrs)
    end)

    activity = from(a in Activity, where: a.action == "goal_created" and a.content["goal_id"] == ^goal.id) |> Repo.one()

    assert activity
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 2 == notifications_count() # 1 reviewer + 1 champion = 2
    assert fetch_notifications(activity.id)
  end
end
