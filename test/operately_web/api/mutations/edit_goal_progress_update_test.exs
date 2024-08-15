defmodule OperatelyWeb.Api.Mutations.EditGoalProgressUpdateTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Goals
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_goal_progress_update, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see goal update", ctx do
      update = create_goal_update(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "space members without view access can't see goal update", ctx do
      add_person_to_space(ctx)
      update = create_goal_update(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "member who is not author can't edit goal update", ctx do
      update = create_goal_update(ctx, [
        company_access_level: Binding.full_access(),
        space_access_level: Binding.no_access(),
      ])

      assert {403, res} = request(ctx.conn, update)
      assert res.message == "You don't have permission to perform this action"
    end

    test "author/champion can edit goal update", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      ctx = %{ctx | creator: champion}
      update = create_goal_update(ctx, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, update)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, update)
      assert_update_edited(update)
    end
  end

  describe "edit_goal_progress_update functionality" do
    setup :register_and_log_in_account

    test "archives goal", ctx do
      update = create_goal_update(ctx)

      assert {200, res} = request(ctx.conn, update)

      assert_update_edited(update)

      update = Repo.reload(update)
      assert res.update == Serializer.serialize(update, level: :full)
    end
  end

  defp request(conn, update) do
    content = rich_text("Edited content") |> Jason.encode!()
    targets = Enum.map(Goals.list_targets(update.updatable_id), fn t ->
      %{"id" => t.id, "value" => 75}
    end) |> Jason.encode!()

    mutation(conn, :edit_goal_progress_update, %{
      id: Paths.goal_update_id(update),
      content: content,
      new_target_values: targets,
    })
  end

  defp assert_update_edited(update) do
    assert update.content["message"] == rich_text("Content")
    Enum.each(update.content["targets"], fn t ->
      assert t["value"] == 50
    end)

    update = Repo.reload(update)

    assert update.content["message"] == rich_text("Edited content")
    Enum.each(update.content["targets"], fn t ->
      assert t["value"] == 75
    end)
  end

  #
  # Helpers
  #

  defp create_goal_update(ctx, attrs \\ []) do
    goal = goal_fixture(ctx[:creator] || ctx.person, Enum.into(attrs, %{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      targets: [
        %{ name: "One", from: 10, to: 100, unit: "unit", index: 0 },
        %{ name: "Two", from: 10, to: 100, unit: "unit", index: 1 },
      ],
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))

    content = rich_text("Content")
    targets = Enum.map(Goals.list_targets(goal.id), fn t ->
      %{"id" => t.id, "value" => 50}
    end)

    {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx[:creator] || ctx.person, goal, content, targets)
    update
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
