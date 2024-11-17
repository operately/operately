defmodule OperatelyWeb.Api.Mutations.ArchiveMessageTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :archive_message, %{})
    end
  end

  describe "permissions" do
  end

  describe "functionality" do
  end
end
