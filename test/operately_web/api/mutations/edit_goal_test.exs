defmodule OperatelyWeb.Api.Mutations.EditGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Goals
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_goal, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't edit a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "company owners can edit a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, goal)

      # Owner
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
    end

    test "space members without edit access can't edit a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "space managers can edit a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      # Not manager
      assert {404, _} = request(ctx.conn, goal)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "champions can edit a goal", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "reviewers can edit a goal", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end
  end

  describe "edit_goal functionality" do
    setup :register_and_log_in_account

    test "edits a goal name", ctx do
      goal = create_goal(ctx, name: "Name")

      assert goal.name == "Name"

      assert {200, res} = request(ctx.conn, goal, name: "Brand new name")
      assert_goal_edited(goal, name: "Brand new name")

      goal = Repo.reload(goal)
      assert res.goal == Serializer.serialize(goal, level: :essential)
    end

    test "edits a goal description", ctx do
      goal = create_goal(ctx)
      new_description = rich_text("Description")

      refute goal.description

      assert {200, _} = request(ctx.conn, goal, description: Jason.encode!(new_description))
      assert_goal_edited(goal, description: new_description)
    end

    test "edits a goal champion and reviewer", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx)

      assert {200, _} = request(ctx.conn, goal, champion_id: champion.id, reviewer_id: reviewer.id)
      assert_goal_edited(goal, champion_id: champion.id, reviewer_id: reviewer.id)
    end

    test "edits a goal timeframe", ctx do
      timeframe = %{
        type: "days", start_date: ~D{2024-08-20}, end_date: ~D{2024-08-25},
      }
      goal = create_goal(ctx)

      assert {200, _} = request(ctx.conn, goal, timeframe: timeframe)
      assert_goal_edited(goal)

      %{timeframe: tf} = Repo.reload(goal)

      assert tf.type == timeframe.type
      assert tf.start_date == timeframe.start_date
      assert tf.end_date == timeframe.end_date
    end

    test "edits goal targets", ctx do
      targets = [
        %{name: "One", from: 0, to: 30, unit: "minutes", index: 0},
        %{name: "Two", from: 5, to: 40, unit: "minutes", index: 1}
      ]
      goal = create_goal(ctx, targets: targets)

      added_targets = [%{ name: "Three", from: 25, to: 60, unit: "minutes", index: 2 }]
      updated_targets = Goals.list_targets(goal.id) |> Enum.map(&(%{&1 | from: 25}))

      assert {200, _} = request(ctx.conn, goal, added_targets: added_targets, updated_targets: updated_targets)
      assert_goal_edited(goal)

      targets = Goals.list_targets(goal.id)

      assert length(targets) == 3
      Enum.each(targets, fn t ->
        assert t.from == 25
      end)
    end

    test "edits goal permissions", ctx do
      alias Operately.Access

      space = group_fixture(ctx.person, %{company_id: ctx.company.id})
      goal = create_goal(ctx, [
        space_id: space.id,
        company_access_level: Binding.comment_access(),
        space_access_level: Binding.edit_access(),
        anonymous_access_level: Binding.view_access(),
      ])
      context_id = Access.get_context!(goal_id: goal.id).id
      anonymous_group_id = Access.get_group!(company_id: ctx.company.id, tag: :anonymous).id
      company_group_id = Access.get_group!(company_id: ctx.company.id, tag: :standard).id
      space_group_id = Access.get_group!(group_id: space.id, tag: :standard).id

      assert Access.get_binding(context_id: context_id, group_id: anonymous_group_id, access_level: Binding.view_access())
      assert Access.get_binding(context_id: context_id, group_id: company_group_id, access_level: Binding.comment_access())
      assert Access.get_binding(context_id: context_id, group_id: space_group_id, access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, goal)
      assert_goal_edited(goal)

      assert Access.get_binding(context_id: context_id, group_id: anonymous_group_id, access_level: Binding.no_access())
      assert Access.get_binding(context_id: context_id, group_id: company_group_id, access_level: Binding.full_access())
      assert Access.get_binding(context_id: context_id, group_id: space_group_id, access_level: Binding.full_access())
    end
  end

  #
  # Steps
  #

  defp request(conn, goal, attrs \\ []) do
    attrs = Enum.into(attrs, %{})

    mutation(conn, :edit_goal, %{
      goal_id: Paths.goal_id(goal),
      name: attrs[:name] || goal.name,
      champion_id: person_id(attrs[:champion_id] || goal.champion_id),
      reviewer_id: person_id(attrs[:reviewer_id] || goal.reviewer_id),
      timeframe: format_timeframe(attrs[:timeframe] || goal.timeframe),
      added_targets: format_targets(attrs[:added_targets] || []),
      updated_targets: format_targets(attrs[:updated_targets] || Goals.list_targets(goal.id)),
      description: attrs[:description] || goal.description,
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.full_access(),
      space_access_level: Binding.full_access(),
    })
  end

  defp assert_goal_edited(goal, changed \\ []) do
    unchanged =
      [:name, :champion_id, :reviewer_id, :description]
      |> Enum.filter(&(not Enum.member?(Keyword.keys(changed), &1)))

    updated_goal = Repo.reload(goal)

    Enum.each(unchanged, fn field ->
      assert get_in(goal, [Access.key(field)]) == get_in(updated_goal, [Access.key(field)])
    end)
    Enum.each(changed, fn {key, value} ->
      assert get_in(updated_goal, [Access.key(key)]) == value
    end)
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs \\ []) do
    goal_fixture(ctx[:creator] || ctx.person, Enum.into(attrs, %{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end

  defp format_timeframe(timeframe) do
    %{
      type: timeframe.type,
      start_date: Date.to_string(timeframe.start_date),
      end_date: Date.to_string(timeframe.end_date),
    }
  end

  defp format_targets(targets) do
    Enum.map(targets, fn t ->
      result = %{
        index: t.index,
        unit: t.unit,
        to: t.to,
        from: t.from,
        name: t.name,
      }

      if Map.has_key?(t, :id) do
        Map.put(result, :id, t.id)
      else
        result
      end
    end)
  end

  defp person_id(id) do
    Operately.People.get_person!(id)
    |> Paths.person_id()
  end
end
