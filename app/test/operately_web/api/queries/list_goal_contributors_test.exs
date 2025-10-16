defmodule OperatelyWeb.Api.Queries.ListGoalContributorsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_goal_contributors, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.add_company_member(:contrib)
      |> Factory.log_in_person(:person)
    end

    @table [
      %{company: :no_access, space: :no_access, goal: :no_access, expected: :forbidden},
      %{company: :no_access, space: :no_access, goal: :champion, expected: :allowed},
      %{company: :no_access, space: :no_access, goal: :reviewer, expected: :allowed},
      %{company: :no_access, space: :view_access, goal: :no_access, expected: :allowed},
      %{company: :no_access, space: :comment_access, goal: :no_access, expected: :allowed},
      %{company: :no_access, space: :edit_access, goal: :no_access, expected: :allowed},
      %{company: :no_access, space: :full_access, goal: :no_access, expected: :allowed},
      %{company: :view_access, space: :no_access, goal: :no_access, expected: :allowed},
      %{company: :comment_access, space: :no_access, goal: :no_access, expected: :allowed},
      %{company: :edit_access, space: :no_access, goal: :no_access, expected: :allowed},
      %{company: :full_access, space: :no_access, goal: :no_access, expected: :allowed}
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} and goal=#{@test.goal}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.creator.id, group_id: space.id, goal_id: goal.id})
        contributor_fixture(ctx.creator, %{project_id: project.id, person_id: ctx.contrib.id})

        assert {200, res} = query(ctx.conn, :list_goal_contributors, %{goal_id: Paths.goal_id(goal)})

        case @test.expected do
          :forbidden ->
            assert length(res.contributors) == 0

          :allowed ->
            assert length(res.contributors) == 2
        end
      end
    end
  end

  describe "list_goal_contributors functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)
      |> Factory.add_goal(:childless_goal, :space, parent_goal: :child_goal)
      |> Factory.add_project(:project1, :space, goal: :parent_goal)
      |> Factory.add_project(:project2, :space, goal: :child_goal)
      |> Factory.add_project(:project3, :space, goal: :child_goal)
      |> Factory.add_project_contributor(:contrib1, :project1, :as_person)
      |> Factory.add_project_contributor(:contrib2, :project1, :as_person)
      |> Factory.add_project_contributor(:contrib3, :project2, :as_person)
      |> Factory.add_project_contributor(:contrib4, :project2, :as_person)
      |> Factory.add_project_contributor(:contrib5, :project3, :as_person)
    end

    test "returns contributors for goal with child goals", ctx do
      assert {200, res} = query(ctx.conn, :list_goal_contributors, %{goal_id: Paths.goal_id(ctx.parent_goal)})

      people = [ctx.creator, ctx.contrib1, ctx.contrib2, ctx.contrib3, ctx.contrib4, ctx.contrib5]

      assert length(res.contributors) == 6

      Enum.each(people, fn p ->
        assert Enum.find(res.contributors, &(Paths.person_id(p) == &1.id))
      end)
    end

    test "returns contributors for goal without child goals", ctx do
      assert {200, res} = query(ctx.conn, :list_goal_contributors, %{goal_id: Paths.goal_id(ctx.child_goal)})

      people = [ctx.creator, ctx.contrib3, ctx.contrib4, ctx.contrib5]

      assert length(res.contributors) == 4

      Enum.each(people, fn p ->
        assert Enum.find(res.contributors, &(Paths.person_id(p) == &1.id))
      end)
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx, company_members_level, space_members_level) do
    space =
      group_fixture(ctx.creator, %{
        company_id: ctx.company.id,
        company_permissions: Binding.from_atom(company_members_level)
      })

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    space
  end

  defp create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    attrs =
      case goal_member_level do
        :champion -> [champion_id: ctx.person.id]
        :reviewer -> [reviewer_id: ctx.person.id]
        _ -> []
      end

    goal =
      goal_fixture(
        ctx.creator,
        Enum.into(attrs, %{
          space_id: space.id,
          company_access_level: Binding.from_atom(company_members_level),
          space_access_level: Binding.from_atom(space_members_level)
        })
      )

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    goal
  end
end
