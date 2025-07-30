defmodule OperatelyWeb.Api.Mutations.CreateGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.ContextualDates.Timeframe

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_goal, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      Map.merge(ctx, %{space: space})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)

      assert {404, res} = request(other_ctx.conn, ctx)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't create goal", ctx do
      assert {403, res} = request(ctx.conn, ctx)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can create goal", ctx do
      give_person_edit_access(ctx)

      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
    end

    test "company owners can create goal", ctx do
      # Not owner
      assert {403, _} = request(ctx.conn, ctx)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space})
    end

    test "company member without view access can't see space", ctx do
      assert {404, res} = request(ctx.conn, ctx)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't create goal", ctx do
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, ctx)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can create goal", ctx do
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
    end

    test "company owners can create goal", ctx do
      # Not owner
      assert {404, _} = request(ctx.conn, ctx)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
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

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(group_id: ctx.company.company_space_id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
