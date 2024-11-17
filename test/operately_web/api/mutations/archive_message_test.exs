defmodule OperatelyWeb.Api.Mutations.ArchiveMessageTest do
  use OperatelyWeb.TurboCase

  alias Operately.Messages.Message

  setup ctx do
    ctx 
    |> Factory.setup()
    |> Factory.add_space(:marketing_space)
    |> Factory.add_messages_board(:messages, :marketing_space)
    |> Factory.add_message(:message, :messages)
    |> Factory.add_draft_message(:draft, :messages)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = request(ctx.conn, ctx.message)
    end
  end

  describe "functionality" do
    setup ctx do
      Factory.log_in_person(ctx, :creator)
    end

    test "it archives a message", ctx do
      assert {200, _} = request(ctx.conn, ctx.message)
      assert_message_archived(ctx.message)
    end

    test "it archives a draft message", ctx do
      assert {200, _} = request(ctx.conn, ctx.draft)
      assert_message_archived(ctx.draft)
    end
  end

  defp request(conn, message) do
    mutation(conn, :archive_message, %{message_id: Paths.message_id(message)})
  end

  defp assert_message_archived(message) do
    assert {:ok, message} = Message.get(:system, id: message.id, opts: [with_deleted: true])
    assert message.deleted_at
  end
end
