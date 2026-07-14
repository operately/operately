defmodule OperatelyWeb.Api.Goals.ListCheckInsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding
  alias Operately.Repo

  setup ctx do
    ctx = register_and_log_in_account(ctx)
    creator = ctx.person
    space = group_fixture(creator, %{company_id: ctx.company.id})

    goal =
      goal_fixture(creator, %{
        space_id: space.id,
        company_access_level: Binding.view_access()
      })

    Map.merge(ctx, %{creator: creator, space: space, goal: goal})
  end

  test "scheduled check-ins are listed before published check-ins for the author", ctx do
    scheduled = goal_update_fixture(ctx.creator, ctx.goal, scheduled_at: Operately.Time.days_from_now(1))
    published = goal_update_fixture(ctx.creator, ctx.goal)

    assert {200, res} = query(ctx.conn, [:goals, :list_check_ins], %{goal_id: Paths.goal_id(ctx.goal)})

    assert Enum.map(res.check_ins, & &1.id) == [
             Paths.goal_update_id(scheduled),
             Paths.goal_update_id(published)
           ]
  end

  test "scheduled check-ins are visible only to their author", ctx do
    scheduled = goal_update_fixture(ctx.creator, ctx.goal, scheduled_at: Operately.Time.days_from_now(1))
    viewer = person_fixture_with_account(%{company_id: ctx.company.id})
    viewer_conn = log_in_account(ctx.conn, Repo.preload(viewer, :account).account)

    assert {200, res} = query(ctx.conn, [:goals, :list_check_ins], %{goal_id: Paths.goal_id(ctx.goal)})
    assert Paths.goal_update_id(scheduled) in Enum.map(res.check_ins, & &1.id)

    assert {200, res} = query(viewer_conn, [:goals, :list_check_ins], %{goal_id: Paths.goal_id(ctx.goal)})
    refute Paths.goal_update_id(scheduled) in Enum.map(res.check_ins, & &1.id)
  end
end
