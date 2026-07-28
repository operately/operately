defmodule Operately.Search.Sources.CoreWork.GoalTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Goals.Goal
  alias Operately.Search.Sources.CoreWork.Goal, as: GoalSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space, name: "Expansion goal")
    |> update_goal(%{description: RichText.rich_text("Market evidence")})
  end

  test "builds goal entries with current scopes and content", ctx do
    attrs = entry_attrs(ctx.goal.id)

    assert attrs.title == "Expansion goal"
    assert attrs.body == "Market evidence"
    assert attrs.body_kind == "description"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(goal_id: ctx.goal.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == nil
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
  end

  test "indexes closed goals and excludes deleted goals", ctx do
    closed = update_goal(ctx, %{closed_at: DateTime.utc_now()}).goal
    assert entry_attrs(closed.id).state == :closed

    Repo.soft_delete!(closed)
    assert {:ok, []} = GoalSource.fetch_by_ids([closed.id])
  end

  test "uses stable UUID keyset pagination and excludes goals in deleted spaces", ctx do
    {:ok, [first]} = GoalSource.fetch_batch(nil, 1)
    {:ok, remaining} = GoalSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))

    Repo.soft_delete!(ctx.space)
    assert {:ok, []} = GoalSource.fetch_by_ids([ctx.goal.id])
  end

  defp update_goal(ctx, attrs) do
    goal =
      ctx.goal
      |> Goal.changeset(attrs)
      |> Repo.update!()

    %{ctx | goal: goal}
  end

  defp entry_attrs(id) do
    assert {:ok, [record]} = GoalSource.fetch_by_ids([id])
    assert {:ok, attrs} = GoalSource.to_entry(record)
    attrs
  end
end
