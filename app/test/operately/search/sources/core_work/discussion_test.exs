defmodule Operately.Search.Sources.CoreWork.DiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Search.Sources.CoreWork.Discussion
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board,
      title: "Research discussion",
      body: RichText.rich_text("Customer findings")
    )
  end

  test "builds published discussion entries from the owning space", ctx do
    attrs = entry_attrs(ctx.discussion.id)

    assert attrs.title == "Research discussion"
    assert attrs.body == "Customer findings"
    assert attrs.body_kind == "content"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(group_id: ctx.space.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == nil
    assert attrs.goal_id == nil
    assert attrs.state == nil
  end

  test "includes archived published discussions and excludes drafts and scheduled posts", ctx do
    Repo.soft_delete!(ctx.discussion)
    assert entry_attrs(ctx.discussion.id).state == :archived

    draft = add_message(ctx, :draft)
    scheduled = add_message(ctx, :scheduled)

    assert :skip = draft.id |> fetch_record() |> Discussion.to_entry()
    assert :skip = scheduled.id |> fetch_record() |> Discussion.to_entry()
  end

  test "uses stable UUID keyset pagination and excludes discussions in deleted spaces", ctx do
    {:ok, [first]} = Discussion.fetch_batch(nil, 1)
    {:ok, remaining} = Discussion.fetch_batch(first.id, 10)

    assert Enum.all?(remaining, &(&1.id > first.id))

    Repo.soft_delete!(ctx.space)
    assert {:ok, []} = Discussion.fetch_by_ids([ctx.discussion.id])
  end

  defp add_message(ctx, state) do
    ctx
    |> Factory.add_message(:"#{state}_discussion", :board, state: state)
    |> Map.fetch!(:"#{state}_discussion")
  end

  defp entry_attrs(id) do
    assert {:ok, attrs} = id |> fetch_record() |> Discussion.to_entry()
    attrs
  end

  defp fetch_record(id) do
    assert {:ok, [record]} = Discussion.fetch_by_ids([id])
    record
  end
end
