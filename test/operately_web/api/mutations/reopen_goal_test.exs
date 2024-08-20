defmodule OperatelyWeb.Api.Mutations.ReopenGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :reopen_goal, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      goal: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      goal: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      goal: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = mutation(ctx.conn, :reopen_goal, %{
          id: Paths.goal_id(goal), 
          message: RichText.rich_text("Some message", :as_string)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res == %{goal: Serializer.serialize(goal, level: :essential)}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
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
    goal = goal_fixture(ctx.creator, %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id, 
        permissions: Binding.from_atom(space_members_level)
      }])
    end

    goal = Operately.Repo.preload(goal, :access_context)

    if goal_member_level != :no_access do
      Operately.Access.Binding.changeset(%{
        group_id: Operately.Access.get_group!(person_id: ctx.person.id),
        context_id: goal.access_context.id,
        access_level: Binding.from_atom(goal_member_level),
        tag: :reviewer,
      })
    end
    
    goal
  end
end 
