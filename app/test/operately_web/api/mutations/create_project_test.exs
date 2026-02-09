defmodule OperatelyWeb.Api.Mutations.CreateProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_project, %{})
    end
  end

  describe "company permissions" do
    @table [
      %{permissions: :view_access, expected: 403},
      %{permissions: :comment_access, expected: 403},
      %{permissions: :edit_access, expected: 200},
      %{permissions: :full_access, expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "create", else: "not create"} project", ctx do
        ctx = ctx
          |> Factory.add_space(:space, company_permissions: Binding.from_atom(@test.permissions))
          |> Factory.add_goal(:goal, :space)

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_project_created(res, ctx.space.id)
          403 ->
            assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "space permissions" do
    @table [
      %{space: :no_access,      expected: 404},
      %{space: :view_access,    expected: 403},
      %{space: :comment_access, expected: 403},
      %{space: :edit_access,    expected: 200},
      %{space: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Map.merge(ctx, %{space: space, goal: goal})
    end

    tabletest @table do
      test "space member with #{@test.space} can #{if @test.expected == 200, do: "create", else: "not create"} project", ctx do
        add_person_to_space(ctx, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_project_created(res, ctx.space.id)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "create_project functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      Map.merge(ctx, %{space: space, goal: goal})
    end

    test "creates project within space", ctx do
      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.space.id)
    end

    test "creates project within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, ctx, space_id: Paths.space_id(space))
      assert_project_created(res, ctx.company.company_space_id)
    end

    test "forces company access level to no_access when space is private", ctx do
      private_space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
      goal = goal_fixture(ctx.person, %{space_id: private_space.id})

      assert {200, res} = request(ctx.conn, ctx,
               space_id: Paths.space_id(private_space),
               goal_id: Paths.goal_id(goal),
               company_access_level: Binding.full_access()
             )

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)
      context = Operately.Access.get_context!(project_id: id)
      company_group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :standard)
      binding = Operately.Access.get_binding!(context_id: context.id, group_id: company_group.id)

      assert binding.access_level == Binding.no_access()
    end
  end

  #
  # Steps
  #

  defp request(conn, ctx, attrs \\ []) do
    mutation(conn, :create_project, Enum.into(attrs, %{
      space_id: Paths.space_id(ctx.space),
      name: "project",
      reviewer_id: Paths.person_id(ctx.person),
      champion_id: Paths.person_id(ctx.person),
      goal_id: Paths.goal_id(ctx.goal),
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access(),
    }))
  end

  defp assert_project_created(res, space_id) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)
    project = Operately.Projects.get_project!(id)
    assert project.group_id == space_id
  end

  #
  # Helpers
  #

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
