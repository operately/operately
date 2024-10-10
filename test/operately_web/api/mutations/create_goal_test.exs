defmodule OperatelyWeb.Api.Mutations.CreateGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.GoalsFixtures, only: [current_quarter: 0]

  alias Operately.Access
  alias Operately.Access.Binding

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

    test "company admins can create goal", ctx do
      # Not admin
      assert {403, _} = request(ctx.conn, ctx)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

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

    test "company admins can create goal", ctx do
      # Not admin
      assert {404, _} = request(ctx.conn, ctx)

      # Admin
      {:ok, _} = Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx)
      assert_goal_created(res)
    end
  end

  describe "create_goal functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

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
    timeframe = current_quarter()

    mutation(conn, :create_goal, Enum.into(attrs, %{
      space_id: Paths.space_id(ctx.space),
      name: "goal",
      reviewer_id: Paths.person_id(ctx.person),
      champion_id: Paths.person_id(ctx.person),
      timeframe: %{
        start_date: Date.to_string(timeframe.start_date),
        end_date: Date.to_string(timeframe.end_date),
        type: timeframe.type,
      },
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
