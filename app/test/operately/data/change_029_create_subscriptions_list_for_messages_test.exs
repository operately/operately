defmodule Operately.Data.Change029CreateSubscriptionsListForMessagesTest do
  use Operately.DataCase

  import Operately.MessagesFixtures

  alias Operately.Support.Factory
  alias Operately.Notifications.Subscription

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
    |> Factory.add_messages_board(:messages_board, :space)
  end

  test "creates subscriptions list for existing messages", ctx do
    people = [ctx.creator, ctx.mike, ctx.bob, ctx.jane]

    messages = Enum.map(1..3, fn _ ->
      message_fixture(ctx.creator.id, ctx.messages_board.id)
    end)

    Enum.each(messages, fn m ->
      Enum.each(people, fn p ->
        assert {:error, :not_found} = Subscription.get(:system, subscription_list_id: m.subscription_list_id, person_id: p.id)
      end)
    end)

    Operately.Data.Change029CreateSubscriptionsListForMessages.run()

    Enum.each(messages, fn m ->
      Enum.each(people, fn p ->
        assert {:ok, _} = Subscription.get(:system, subscription_list_id: m.subscription_list_id, person_id: p.id)
      end)
    end)
  end
end
