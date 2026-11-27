defmodule Operately.Messages.MessageTest do
  use Operately.DataCase
  alias Operately.Access.Binding
  alias Operately.Messages.Message
  alias Operately.MessagesFixtures
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product_space)
    |> Factory.add_messages_board(:message_board, :product_space)
  end

  describe "ownership" do
    test "a message must have exactly one owner, including on update", ctx do
      message = MessagesFixtures.message_fixture(ctx.creator.id, ctx.message_board.id)

      for attrs <- [%{messages_board_id: nil}, %{project_id: Ecto.UUID.generate()}] do
        refute Message.changeset(message, attrs).valid?
      end
    end

    test "the database rejects missing or multiple owners when bypassing changeset validation", ctx do
      ctx = Factory.add_goal(ctx, :goal, :product_space)
      message = MessagesFixtures.message_fixture(ctx.creator.id, ctx.message_board.id)

      for attrs <- [%{messages_board_id: nil}, %{goal_id: ctx.goal.id}] do
        assert_raise Ecto.ConstraintError, ~r/messages_exactly_one_owner/, fn ->
          Repo.update!(change(message, attrs), mode: :savepoint)
        end
      end
    end

    test "access follows the owning board, project, or goal", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:space_viewer, :product_space, permissions: :view_access)
        |> Factory.add_project(:project, :product_space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access(), champion: :creator)
        |> Factory.add_goal(:goal, :product_space, company_access: Binding.no_access(), space_access: Binding.no_access())

      board_message = MessagesFixtures.message_fixture(ctx.creator.id, ctx.message_board.id)
      project_message = MessagesFixtures.message_fixture(ctx.creator.id, nil, project_id: ctx.project.id)
      goal_message = MessagesFixtures.message_fixture(ctx.creator.id, nil, goal_id: ctx.goal.id)

      assert {:ok, _} = Message.get(ctx.space_viewer, id: board_message.id)

      for message <- [project_message, goal_message] do
        assert {:ok, _} = Message.get(ctx.creator, id: message.id)
        assert {:error, :not_found} = Message.get(ctx.space_viewer, id: message.id)
      end

      assert Enum.map(Message.list(ctx.space_viewer), & &1.id) == [board_message.id]
    end
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
