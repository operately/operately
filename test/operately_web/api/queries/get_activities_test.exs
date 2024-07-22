defmodule OperatelyWeb.Api.Queries.GetActivitiesTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_activities, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      space = group_fixture(champion)

      attrs = %{
        scope_type: "company",
        scope_id: Paths.company_id(ctx.company),
        actions: ["goal_created"]
      }

      Map.merge(ctx, %{space: space, champion: champion, reviewer: reviewer, attrs: attrs})
    end

    test "company members have no access", ctx do
      goal_fixture(ctx.champion, %{
        space_id: ctx.company.company_space_id,
        company_access_level: Binding.no_access(),
      })

      assert {200, res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert res.activities == []
    end

    test "company members have access", ctx do
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.company.company_space_id,
        company_access_level: Binding.view_access(),
      })

      assert {200, %{ activities: activities } = _res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert goal.id == hd(activities).content.goal.id
    end

    test "space members have no access", ctx do
      Groups.add_members(ctx.space.id, [%{id: ctx.person.id, permissions: Binding.edit_access()}])
      goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      assert {200, res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert res.activities == []
    end

    test "space members have access", ctx do
      Groups.add_members(ctx.space.id, [%{id: ctx.person.id, permissions: Binding.edit_access()}])
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        space_access_level: Binding.view_access(),
        company_access_level: Binding.no_access(),
      })

      assert {200, %{ activities: activities } = _res} = query(ctx.conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert goal.id == hd(activities).content.goal.id
    end

    test "reviewers have access", ctx do
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        reviewer_id: ctx.reviewer.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      account = Repo.preload(ctx.reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{ activities: activities } = _res} = query(conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert goal.id == hd(activities).content.goal.id
    end

    test "champions have access", ctx do
      goal = goal_fixture(ctx.reviewer, %{
        space_id: ctx.space.id,
        champion_id: ctx.champion.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      account = Repo.preload(ctx.champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{ activities: activities } = _res} = query(conn, :get_activities, ctx.attrs)

      assert length(activities) == 1
      assert goal.id == hd(activities).content.goal.id
    end
  end

  describe "get_activities functionality" do
    setup :register_and_log_in_account
  end
end
