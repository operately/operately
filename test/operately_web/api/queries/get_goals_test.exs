defmodule OperatelyWeb.Api.Queries.GetGoalsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import OperatelyWeb.Api.Serializer

  alias OperatelyWeb.Paths
  alias Operately.Access.Binding
  alias Operately.{Repo, Groups}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goals, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      space_id = Paths.space_id(space)

      Map.merge(ctx, %{space: space, space_id: space_id, creator: creator})
    end

    test "company members have no access", ctx do
      Enum.each(1..3, fn _ ->
        goal_fixture(ctx.creator, %{
          space_id: ctx.space.id,
          company_access_level: Binding.no_access(),
        })
      end)

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})
      assert length(res.goals) == 0

      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.view_access(),
      })

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})
      assert length(res.goals) == 1
    end

    test "company members have access", ctx do
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
      })
      goals = Enum.map(1..3, fn _ ->
        goal_fixture(ctx.creator, %{
          space_id: ctx.space.id,
          company_access_level: Binding.view_access(),
        })
      end)

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})

      assert_goals(res, goals)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)

      Enum.each(1..3, fn _ ->
        goal_fixture(ctx.creator, %{
          space_id: ctx.space.id,
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access(),
        })
      end)

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})
      assert length(res.goals) == 0

      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.view_access(),
      })

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})
      assert length(res.goals) == 1
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)

      goals = Enum.map(1..3, fn _ ->
        goal_fixture(ctx.creator, %{
          space_id: ctx.space.id,
          company_access_level: Binding.no_access(),
          space_access_level: Binding.view_access(),
        })
      end)

      assert {200, res} = query(ctx.conn, :get_goals, %{space_id: ctx.space_id})

      assert_goals(res, goals)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: champion.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_goals, %{space_id: ctx.space_id})

      assert_goals(res, [goal])
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        reviewer_id: reviewer.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_goals, %{space_id: ctx.space_id})

      assert_goals(res, [goal])
    end
  end

  describe "get_goals functionality" do
    setup :register_and_log_in_account

    test "include_last_check_in", ctx do
      goal1 = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      goal2 = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      update1 = create_update(ctx.person, goal1)
      _update2 = create_update(ctx.person, goal1)

      update3 = create_update(ctx.person, goal2)
      _update4 = create_update(ctx.person, goal2)

      update1 = Operately.Repo.preload(update1, [:author, [reactions: :author]])
      update3 = Operately.Repo.preload(update3, [:author, [reactions: :author]])

      assert {200, res} = query(ctx.conn, :get_goals, %{include_last_check_in: true})
      assert length(res.goals) == 2

      assert Enum.find(res.goals, &(&1.last_check_in == serialize(update1, level: :full)))
      assert Enum.find(res.goals, &(&1.last_check_in == serialize(update3, level: :full)))
    end
  end

  #
  # Helpers
  #

  defp assert_goals(res, goals) do
    assert length(res.goals) == length(goals)

    Enum.each(goals, fn goal ->
      assert Enum.find(res.goals, &(&1.id == Paths.goal_id(goal)))
    end)
  end

  defp add_person_to_space(ctx) do
    Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp create_update(person, goal) do
    goal_update_fixture(person, goal)
  end
end
