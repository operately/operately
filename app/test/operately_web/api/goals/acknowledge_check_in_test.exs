defmodule OperatelyWeb.Api.Goals.AcknowledgeCheckInTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :acknowledge_check_in], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, goal: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, goal: :champion, expected: 200},
      %{company: :no_access, space: :no_access, goal: :reviewer, expected: 200},
      %{company: :no_access, space: :comment_access, goal: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, goal: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, goal: :no_access, expected: 200},
      %{company: :comment_access, space: :no_access, goal: :no_access, expected: 403},
      %{company: :edit_access, space: :no_access, goal: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, goal: :no_access, expected: 200}
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        goal = create_goal(ctx, @test.company, @test.space, @test.goal)
        update = goal_update_fixture(ctx.creator, goal)

        assert {code, res} = request(ctx.conn, update)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_response(res, update)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    test "authors cannot acknowledge their own check-ins", ctx do
      goal = create_goal(ctx, :no_access, :no_access, :champion)
      update = goal_update_fixture(ctx.person, goal)

      assert {400, res} = request(ctx.conn, update)
      assert res.message == "Authors cannot acknowledge their own check-ins"
    end

    test "draft updates cannot be acknowledged", ctx do
      goal = create_goal(ctx, :no_access, :no_access, :reviewer)
      update = goal_update_fixture(ctx.creator, goal, post_as_draft: true)

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"

      update = Repo.reload(update)
      refute update.acknowledged_at
      refute update.acknowledged_by_id
    end
  end

  describe "acknowledge_goal_progress_update functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "acknowledges goal update", ctx do
      goal = goal_fixture(ctx.creator, %{space_id: ctx.company.company_space_id, reviewer_id: ctx.person.id})
      update = goal_update_fixture(ctx.creator, goal)

      refute update.acknowledged_at
      refute update.acknowledged_by_id

      assert {200, res} = mutation(ctx.conn, [:goals, :acknowledge_check_in], %{id: Paths.goal_update_id(update)})
      assert_response(res, update)
    end

    test "idempotency: acknowledging the same check-in multiple times does not change the state", ctx do
      goal = goal_fixture(ctx.creator, %{space_id: ctx.company.company_space_id, reviewer_id: ctx.person.id})
      update = goal_update_fixture(ctx.creator, goal)

      assert {200, res} = request(ctx.conn, update)
      assert_response(res, update)
      assert acknowledge_activity_count() == 1

      assert {200, res} = request(ctx.conn, update)
      assert_response(res, update)
      assert acknowledge_activity_count() == 1
    end
  end

  #
  # Steps
  #

  defp request(conn, update) do
    mutation(conn, [:goals, :acknowledge_check_in], %{id: Paths.goal_update_id(update)})
  end

  defp assert_response(res, update) do
    update = Repo.reload(update) |> Repo.preload(:goal)

    assert update.acknowledged_at
    assert update.acknowledged_by_id
    assert res.update == Serializer.serialize(update, level: :full)
  end

  defp acknowledge_activity_count do
    import Ecto.Query, only: [from: 2]

    from(a in Operately.Activities.Activity, where: a.action == "goal_check_in_acknowledgement")
    |> Operately.Repo.aggregate(:count)
  end

  defp create_goal(ctx, company_members_level, space_members_level, goal_member_level) do
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
          space_id: ctx.space.id,
          company_access_level: Binding.from_atom(company_members_level),
          space_access_level: Binding.from_atom(space_members_level)
        })
      )

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, ctx.space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    goal
  end
end
