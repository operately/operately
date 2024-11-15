defmodule Operately.Messages.MessageTest do
  use Operately.DataCase
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product_space)
    |> Factory.add_messages_board(:message_board, :product_space)
  end

  describe "creating a message" do
    setup ctx do
      list = Operately.NotificationsFixtures.subscriptions_list_fixture()

      cs = Operately.Messages.Message.changeset(%{
        subscription_list_id: list.id,
        author_id: ctx.creator.id,
        messages_board_id: ctx.message_board.id,
        title: "Draft Message",
        body: RichText.rich_text("This is a draft message."),
        state: :published,
      })

      {:ok, message} = Operately.Repo.insert(cs)

      Map.put(ctx, :message, message)
    end

    test "published_at is set", ctx do
      assert ctx.message.published_at != nil
    end
  end

  describe "creating a draft message" do
    setup ctx do
      list = Operately.NotificationsFixtures.subscriptions_list_fixture()

      cs = Operately.Messages.Message.changeset(%{
        subscription_list_id: list.id,
        author_id: ctx.creator.id,
        messages_board_id: ctx.message_board.id,
        title: "Draft Message",
        body: RichText.rich_text("This is a draft message."),
        state: :draft,
      })

      {:ok, message} = Operately.Repo.insert(cs)

      Map.put(ctx, :message, message)
    end

    test "state is draft", ctx do
      assert ctx.message.state == :draft
    end

    test "published_at is nil", ctx do
      assert ctx.message.published_at == nil
    end
  end

  describe "updating state to published" do
    setup ctx do
      list = Operately.NotificationsFixtures.subscriptions_list_fixture()

      cs = Operately.Messages.Message.changeset(%{
        subscription_list_id: list.id,
        author_id: ctx.creator.id,
        messages_board_id: ctx.message_board.id,
        title: "Draft Message",
        body: RichText.rich_text("This is a draft message."),
        state: :draft,
      })

      assert {:ok, message} = Operately.Repo.insert(cs)
      assert message.state == :draft

      cs = Operately.Messages.Message.changeset(message, %{state: :published})

      assert {:ok, message} = Operately.Repo.update(cs)

      Map.put(ctx, :message, message)
    end

    test "state transitions to published", ctx do
      assert ctx.message.state == :published
    end

    test "published_at is set", ctx do
      assert ctx.message.published_at != nil
    end
  end
end
