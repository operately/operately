defmodule OperatelyWeb.Api.Queries.GetGoalCheckInsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  defp request(ctx, params) do
    query(ctx.conn, [:goals, :get_check_ins], params)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = request(ctx, %{})
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
      {goal_id, _} = create_goal_and_updates(ctx, company_access: Binding.no_access())
      assert {404, _} = request(ctx, %{goal_id: goal_id})
    end

    test "company members have access", ctx do
      {goal_id, updates} = create_goal_and_updates(ctx, company_access: Binding.view_access())

      assert {200, res} = request(ctx, %{goal_id: goal_id})
      assert length(res.check_ins) == length(updates)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      {goal_id, _} = create_goal_and_updates(ctx, space_access: Binding.no_access())
      assert {404, _} = request(ctx, %{goal_id: goal_id})
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      {goal_id, updates} = create_goal_and_updates(ctx, space_access: Binding.view_access())

      assert {200, res} = request(ctx, %{goal_id: goal_id})
      assert length(res.check_ins) == length(updates)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      {goal_id, updates} = create_goal_and_updates(ctx, champion_id: champion.id)

      ctx = log_in_account(ctx, champion)

      assert {200, res} = request(ctx, %{goal_id: goal_id})
      assert length(res.check_ins) == length(updates)
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {goal_id, updates} = create_goal_and_updates(ctx, reviewer_id: reviewer.id)

      ctx = log_in_account(ctx, reviewer)

      assert {200, res} = request(ctx, %{goal_id: goal_id})
      assert length(res.check_ins) == length(updates)
    end
  end

  #
  # Helpers
  #

  defp create_goal_and_updates(ctx, opts) do
    company_access = Keyword.get(opts, :company_access, Binding.no_access())
    space_access = Keyword.get(opts, :space_access, Binding.no_access())
    champion_id = Keyword.get(opts, :champion_id, ctx.creator.id)
    reviewer_id = Keyword.get(opts, :reviewer_id, ctx.creator.id)

    goal =
      goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: champion_id,
        reviewer_id: reviewer_id,
        company_access_level: company_access,
        space_access_level: space_access
      })

    updates =
      Enum.map(1..3, fn _ ->
        goal_update_fixture(ctx.creator, goal)
      end)

    goal_id = Paths.goal_id(goal)

    {goal_id, updates}
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [
      %{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }
    ])
  end
end
