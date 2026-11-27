defmodule Operately.Messages.Notifications do
  alias Operately.Access.BindedPeopleLoader
  alias Operately.Messages.{Message, Owner}
  alias Operately.Notifications.{Subscriber, SubscribersLoader}
  alias Operately.Repo

  def get_subscribers(message_id, opts \\ []) do
    message = Repo.get!(Message, message_id)
    message = Repo.preload(message, Owner.subscriber_preloads(message))
    {context, candidates} = eligible_subscribers(message)

    SubscribersLoader.load_for_notifications(%{message | access_context: context}, Enum.map(candidates, & &1.person), Keyword.get(opts, :ignore, []))
  end

  def potential_subscribers(message) do
    {context, candidates} = eligible_subscribers(message)
    message = SubscribersLoader.preload_subscriptions(%{message | access_context: context})
    Subscriber.from_message(message, candidates)
  end

  defp eligible_subscribers(message) do
    {context, candidates} = Owner.subscribers(message)

    if message.messages_board_id do
      {context, candidates}
    else
      allowed = MapSet.new(BindedPeopleLoader.load(context.id), & &1.id)
      {context, Enum.filter(candidates, &MapSet.member?(allowed, &1.person.id))}
    end
  end
end
