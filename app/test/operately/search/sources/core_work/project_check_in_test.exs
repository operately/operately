defmodule Operately.Search.Sources.CoreWork.ProjectCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.{CheckIn, Project}
  alias Operately.Search.Sources.CoreWork.ProjectCheckIn, as: ProjectCheckInSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> update_check_in(%{
      description: RichText.rich_text("Customer evidence"),
      published_at: ~U[2026-07-20 12:00:00Z]
    })
  end

  test "builds published project check-ins with inherited scopes and parent state", ctx do
    attrs = entry_attrs(ctx.check_in.id)

    assert attrs.title == "Check-in on 2026-07-20"
    assert attrs.body == "Customer evidence"
    assert attrs.body_kind == "description"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == ctx.project.id
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
    assert attrs.source_inserted_at == ctx.check_in.inserted_at
    assert NaiveDateTime.compare(attrs.source_updated_at, ctx.check_in.updated_at) in [:eq, :gt]

    ctx.project
    |> Project.changeset(%{status: "paused"})
    |> Repo.update!()

    assert entry_attrs(ctx.check_in.id).state == :paused

    ctx.project
    |> Project.changeset(%{status: "closed", closed_at: DateTime.utc_now()})
    |> Repo.update!()

    assert entry_attrs(ctx.check_in.id).state == :closed
  end

  test "uses inserted date when legacy published_at is missing", ctx do
    ctx.check_in
    |> Ecto.Changeset.change(published_at: nil)
    |> Repo.update!()

    expected_date = ctx.check_in.inserted_at |> NaiveDateTime.to_date() |> Date.to_iso8601()
    assert entry_attrs(ctx.check_in.id).title == "Check-in on #{expected_date}"
  end

  test "treats malformed rich content as an empty body", ctx do
    ctx.check_in
    |> Ecto.Changeset.change(description: %{"content" => "invalid"})
    |> Repo.update!()

    assert entry_attrs(ctx.check_in.id).body == ""
  end

  test "skips drafts, scheduled records, archived parents, and deleted spaces", ctx do
    assert :skip = ctx.check_in |> update_state(:draft) |> to_entry()
    assert :skip = ctx.check_in |> update_state(:scheduled) |> to_entry()

    ctx.project |> Repo.soft_delete!()
    assert :skip = ctx.check_in |> fetch_record() |> ProjectCheckInSource.to_entry()

    ctx.project |> Ecto.Changeset.change(deleted_at: nil) |> Repo.update!()
    ctx.space |> Repo.soft_delete!()
    assert :skip = ctx.check_in |> fetch_record() |> ProjectCheckInSource.to_entry()
  end

  test "uses stable UUID keyset pagination", ctx do
    {:ok, [first]} = ProjectCheckInSource.fetch_batch(nil, 1)
    {:ok, remaining} = ProjectCheckInSource.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))
    assert Enum.any?([first | remaining], &(&1.id == ctx.check_in.id))
  end

  defp update_check_in(ctx, attrs) do
    check_in =
      ctx.check_in
      |> CheckIn.changeset(attrs)
      |> Repo.update!()

    %{ctx | check_in: check_in}
  end

  defp update_state(check_in, state) do
    check_in
    |> Ecto.Changeset.change(state: state)
    |> Repo.update!()
  end

  defp entry_attrs(id) do
    id
    |> fetch_record()
    |> ProjectCheckInSource.to_entry()
    |> then(fn {:ok, attrs} -> attrs end)
  end

  defp to_entry(check_in), do: check_in |> fetch_record() |> ProjectCheckInSource.to_entry()

  defp fetch_record(%{id: id}), do: fetch_record(id)

  defp fetch_record(id) do
    assert {:ok, [record]} = ProjectCheckInSource.fetch_by_ids([id])
    record
  end
end
