defmodule Operately.Search.Sources.CoreWork.GoalCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Goals.Goal
  alias Operately.Search.Sources.CoreWork.GoalCheckIn, as: GoalCheckInSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)

    check_in =
      ctx.check_in
      |> Ecto.Changeset.change(
        message: RichText.rich_text("Revenue evidence"),
        published_at: ~U[2026-07-21 12:00:00Z]
      )
      |> Repo.update!()

    %{ctx | check_in: check_in}
  end

  test "builds published goal check-ins with inherited scopes and parent state", ctx do
    attrs = entry_attrs(ctx.check_in.id)

    assert attrs.title == "Check-in on 2026-07-21"
    assert attrs.body == "Revenue evidence"
    assert attrs.body_kind == "message"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(goal_id: ctx.goal.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == nil
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
    assert attrs.source_inserted_at == ctx.check_in.inserted_at

    ctx.goal
    |> Goal.changeset(%{closed_at: DateTime.utc_now()})
    |> Repo.update!()

    assert entry_attrs(ctx.check_in.id).state == :closed
  end

  test "treats malformed rich content as an empty body", ctx do
    ctx.check_in
    |> Ecto.Changeset.change(message: %{"content" => "invalid"})
    |> Repo.update!()

    assert entry_attrs(ctx.check_in.id).body == ""
  end

  test "skips drafts, scheduled records, deleted goals, and deleted spaces", ctx do
    assert :skip = ctx.check_in |> update_state(:draft) |> to_entry()
    assert :skip = ctx.check_in |> update_state(:scheduled) |> to_entry()

    ctx.goal |> Repo.soft_delete!()
    assert :skip = ctx.check_in |> fetch_record() |> GoalCheckInSource.to_entry()

    ctx.goal |> Ecto.Changeset.change(deleted_at: nil) |> Repo.update!()
    ctx.space |> Repo.soft_delete!()
    assert :skip = ctx.check_in |> fetch_record() |> GoalCheckInSource.to_entry()
  end

  test "uses stable UUID keyset pagination", ctx do
    {:ok, [first]} = GoalCheckInSource.fetch_batch(nil, 1)
    {:ok, remaining} = GoalCheckInSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))
    assert Enum.any?([first | remaining], &(&1.id == ctx.check_in.id))
  end

  defp update_state(check_in, state) do
    check_in
    |> Ecto.Changeset.change(state: state)
    |> Repo.update!()
  end

  defp entry_attrs(id) do
    id
    |> fetch_record()
    |> GoalCheckInSource.to_entry()
    |> then(fn {:ok, attrs} -> attrs end)
  end

  defp to_entry(check_in), do: check_in |> fetch_record() |> GoalCheckInSource.to_entry()

  defp fetch_record(%{id: id}), do: fetch_record(id)

  defp fetch_record(id) do
    assert {:ok, [record]} = GoalCheckInSource.fetch_by_ids([id])
    record
  end
end
