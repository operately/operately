defmodule OperatelyWeb.Api.Mutations.CreateGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures

  alias Operately.Access.Binding
  alias Operately.ContextualDates.Timeframe

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_goal, %{})
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
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "create", else: "not create"} goal", ctx do
        ctx = Factory.add_space(ctx, :space, company_permissions: Binding.from_atom(@test.permissions))

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_goal_created(res)
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

      Map.merge(ctx, %{space: space})
    end

    tabletest @table do
      test "space member with #{@test.space} can #{if @test.expected == 200, do: "create", else: "not create"} goal", ctx do
        add_person_to_space(ctx, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, ctx)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_goal_created(res)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "goal's reviewer and chamption permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
    end

    test "Goal isn't created when champion doesn't have access to the space", ctx do
      assert {400, res} = request(ctx.conn, ctx, %{
        space_id: Paths.space_id(ctx.space),
        reviewer_id: Paths.person_id(ctx.creator),
        champion_id: Paths.person_id(ctx.company_member),
      })
      assert res.message == "The selected champion doesn't have access to the selected space"
    end

    test "Goal successfully created when champion has access to the space", ctx do
      assert {200, res} = request(ctx.conn, ctx, %{
        space_id: Paths.space_id(ctx.space),
        reviewer_id: Paths.person_id(ctx.creator),
        champion_id: Paths.person_id(ctx.space_member),
      })
      assert_goal_created(res)
    end

    test "Goal isn't created when reviewer doesn't have access to the space", ctx do
      assert {400, res} = request(ctx.conn, ctx, %{
        space_id: Paths.space_id(ctx.space),
        reviewer_id: Paths.person_id(ctx.company_member),
        champion_id: Paths.person_id(ctx.creator),
      })
      assert res.message == "The selected reviewer doesn't have access to the selected space"
    end

    test "Goal successfully created when reviewer has access to the space", ctx do
      assert {200, res} = request(ctx.conn, ctx, %{
        space_id: Paths.space_id(ctx.space),
        reviewer_id: Paths.person_id(ctx.space_member),
        champion_id: Paths.person_id(ctx.creator),
      })
      assert_goal_created(res)
    end
  end

  describe "create_goal functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      Map.merge(ctx, %{space: space})
    end

    test "creates goal within space", ctx do
      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
    end

    test "creates goal within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, ctx, space_id: Paths.space_id(space))
      assert_goal_created(res)
    end

    test "forces company access level to no_access when space is private", ctx do
      private_space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})

      assert {200, res} = request(ctx.conn, ctx,
               space_id: Paths.space_id(private_space),
               company_access_level: Binding.full_access()
             )

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.goal.id)
      context = Operately.Access.get_context!(goal_id: id)
      company_group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :standard)
      binding = Operately.Access.get_binding!(context_id: context.id, group_id: company_group.id)

      assert binding.access_level == Binding.no_access()
    end
  end

  #
  # Steps
  #

  defp request(conn, ctx, attrs \\ []) do
    timeframe = Timeframe.current_quarter() |> Serializer.serialize()

    mutation(conn, :create_goal, Enum.into(attrs, %{
      space_id: Paths.space_id(ctx.space),
      name: "goal",
      reviewer_id: Paths.person_id(ctx.person),
      champion_id: Paths.person_id(ctx.person),
      timeframe: timeframe,
      targets: [
        %{name: "name", from: 10, to: 20, unit: "-", index: 1},
        %{name: "another", from: 10, to: 20, unit: "-", index: 2},
      ],
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access(),
    }))
  end

  defp assert_goal_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.goal.id)
    assert Operately.Goals.get_goal!(id)
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
