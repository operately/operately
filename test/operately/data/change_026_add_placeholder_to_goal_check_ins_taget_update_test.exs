defmodule Operately.Data.Change026AddPlaceholderToGoalCheckInsTagetUpdateTest do
  use Operately.DataCase

  import OperatelyWeb.Api.Serializer
  import Operately.Support.RichText
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures

  alias Operately.{Repo, Goals}

  setup ctx do
    company = company_fixture(%{})
    creator = person_fixture_with_account(%{company_id: company.id})
    goal = goal_fixture(creator, %{space_id: company.company_space_id})


    Map.merge(ctx, %{creator: creator, goal: goal})
  end

  test "creates placeholder for goal check-in target update", ctx do
    check_ins = Enum.map(1..3, fn _ ->
      create_update(ctx.goal)
    end)

    Enum.each(check_ins, fn c ->
      c = serialize(c, level: :full)
      assert c.goal_target_updates == nil
    end)

    Operately.Data.Change026AddPlaceholderToGoalCheckInsTagetUpdate.run()

    Enum.each(check_ins, fn c ->
      c = Repo.reload(c) |> serialize(level: :full)
      assert c.goal_target_updates == []
    end)
  end

  test "migration ignores check-ins that have targets", ctx do
    check_ins = Enum.map(1..3, fn _ ->
      create_update(ctx.goal)
    end)
    check_ins_to_ignore = Enum.map(1..3, fn _ ->
      create_update_with_targets(ctx)
    end)

    Operately.Data.Change026AddPlaceholderToGoalCheckInsTagetUpdate.run()

    Enum.each(check_ins, fn c ->
      updated_c = Repo.reload(c)
      assert serialize(c, level: :full).goal_target_updates != serialize(updated_c, level: :full).goal_target_updates
    end)
    Enum.each(check_ins_to_ignore, fn c ->
      ignored_c = Repo.reload(c)
      assert serialize(c, level: :full).goal_target_updates == serialize(ignored_c, level: :full).goal_target_updates
    end)
  end

  #
  # Helpers
  #

  defp create_update(goal) do
    update_fixture(%{
      type: :goal_check_in,
      updatable_id: goal.id,
      updatable_type: :goal,
      author_id: goal.creator_id,
    })
  end

  defp create_update_with_targets(ctx) do
    targets = Enum.map(Goals.list_targets(ctx.goal.id), fn t ->%{"id" => t.id, "value" => t.value+10}end)
    {:ok, check_in} = Operately.Operations.GoalCheckIn.run(ctx.creator, ctx.goal, rich_text("content"), targets)
    check_in
  end
end
