defmodule OperatelyWeb.Api.Mutations.DeleteGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Goals.Goal
  alias Operately.Access.Binding

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :delete_goal, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      goal: :no_access,  expected: 404},
      %{company: :no_access,      space: :no_access,      goal: :champion,   expected: 200},
      %{company: :no_access,      space: :no_access,      goal: :reviewer,   expected: 200},

      %{company: :no_access,      space: :comment_access, goal: :no_access,  expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,  expected: 403},
      %{company: :no_access,      space: :full_access,    goal: :no_access,  expected: 200},

      %{company: :comment_access, space: :no_access,      goal: :no_access,  expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,  expected: 403},
      %{company: :full_access,    space: :no_access,      goal: :no_access,  expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} and goal=#{@test.goal}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, :delete_goal, %{
          goal_id: Paths.goal_id(goal),
        })
        assert code == @test.expected


        case @test.expected do
          200 ->
            {:error, :not_found} = Goal.get(:system, id: goal.id)
          403 ->
            {:ok, _} = Goal.get(:system, id: goal.id)
            assert res.message == "You don't have permission to perform this action"
          404 ->
            {:ok, _} = Goal.get(:system, id: goal.id)
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  #
  # Helpers
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    attrs = case goal_member_level do
      :champion -> [champion_id: ctx.person.id]
      :reviewer -> [reviewer_id: ctx.person.id]
      _ -> []
    end

    goal = goal_fixture(ctx.creator, Enum.into(attrs, %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }))

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    goal
  end
end
