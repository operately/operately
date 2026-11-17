defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.UpdateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a space discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)

    assert {:ok, %{discussion: discussion}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.message_id(ctx.discussion),
               "title" => "Updated space discussion",
               "content" => "Updated space discussion content"
             })

    assert discussion.title == "Updated space discussion"

    discussion = ToolConnHelper.reload(ctx.discussion)

    assert discussion.title == "Updated space discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.body) == "Updated space discussion content"
  end

  test "draft scheduling preserves omitted fields and can be cancelled" do
    Oban.Testing.with_testing_mode(:manual, fn ->
      ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
      conn = ToolConnHelper.conn(ctx)
      assert {:ok, %{discussion: draft}} = OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussion.call(conn, %{
        "space_id" => Paths.space_id(ctx.space), "title" => "Draft", "content" => "Initial", "post_as_draft" => true
      })
      id = ToolConnHelper.decode_id!(draft.id)
      assert Operately.Repo.get!(Operately.Messages.Message, id).state == :draft
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600) |> DateTime.truncate(:second)
      assert {:ok, _} = UpdateDiscussion.call(conn, %{"discussion_id" => draft.id, "scheduled_at" => DateTime.to_iso8601(scheduled_at)})
      assert {:ok, _} = UpdateDiscussion.call(conn, %{"discussion_id" => draft.id, "content" => "Revised"})
      scheduled = Operately.Repo.get!(Operately.Messages.Message, id)
      assert scheduled.state == :scheduled
      assert scheduled.scheduled_at == scheduled_at
      assert scheduled.title == "Draft"
      assert {:ok, _} = UpdateDiscussion.call(conn, %{"discussion_id" => draft.id, "state" => "draft"})
      cancelled = Operately.Repo.get!(Operately.Messages.Message, id)
      assert cancelled.state == :draft
      assert is_nil(cancelled.scheduled_at)
      assert {:ok, _} = OperatelyWeb.Mcp.Tools.Spaces.PublishDiscussion.call(conn, %{"discussion_id" => draft.id})
      assert Operately.Repo.get!(Operately.Messages.Message, id).state == :published
    end)
  end

  test "rejects schedules without a timezone" do
    ctx = %{} |> Factory.setup()
    assert {:error, :invalid_arguments} = UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
      "discussion_id" => Operately.ShortUuid.encode!(Ecto.UUID.generate()), "scheduled_at" => "2026-12-01T12:00:00"
    })
  end
end
