defmodule OperatelyWeb.Api.Mutations.AcknowledgeGoalProgressUpdateTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :acknowledge_goal_progress_update, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see an update", ctx do
      update = create_update(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "company members can't acknowledge an update", ctx do
      update = create_update(ctx, company_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, update)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members without view access can't see an update", ctx do
      add_person_to_space(ctx)
      update = create_update(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "space members can't acknowledge an update", ctx do
      add_person_to_space(ctx)
      update = create_update(ctx, space_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, update)
      assert res.message == "You don't have permission to perform this action"
    end

    test "champion can't acknowledge an update", ctx do
      update = create_update(ctx, champion_id: ctx.person.id)

      assert {403, res} = request(ctx.conn, update)
      assert res.message == "You don't have permission to perform this action"
    end

    test "reviewers can acknowledge an update", ctx do
      update = create_update(ctx, reviewer_id: ctx.person.id)

      assert {200, res} = request(ctx.conn, update)
      assert_response(res, update)
    end
  end

  describe "acknowledge_goal_progress_update functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "acknowledges goal update", ctx do
      update = create_update(ctx, reviewer_id: ctx.person.id)

      refute update.acknowledged
      refute update.acknowledged_at
      refute update.acknowledging_person_id

      assert {200, res} = mutation(ctx.conn, :acknowledge_goal_progress_update, %{id: Paths.goal_update_id(update)})
      assert_response(res, update)
    end
  end

  #
  # Steps
  #

  defp request(conn, update) do
    mutation(conn, :acknowledge_goal_progress_update, %{id: Paths.goal_update_id(update)})
  end

  defp assert_response(res, update) do
    update = Repo.reload(update)

    assert update.acknowledged
    assert update.acknowledged_at
    assert update.acknowledging_person_id
    assert res.update == Serializer.serialize(update)
  end

  #
  # Helpers
  #

  defp create_update(ctx, opts) do
    goal = goal_fixture(ctx.creator, Enum.into(opts, %{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Keyword.get(opts, :company_access_level, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access_level, Binding.no_access()),
    }))
    update_fixture(%{type: :goal_check_in, updatable_id: goal.id, updatable_type: :goal, author_id: ctx.creator.id})
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
