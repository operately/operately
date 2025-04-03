defmodule Operately.Operations.Notifications.Subscription do
  alias Ecto.Multi
  alias Operately.{Notifications, RichContent}
  alias Operately.Notifications.Subscription

  def insert(multi, author, attrs) do
    mentioned = RichContent.find_mentioned_ids(attrs.content, :decode_ids)
    invited = [author.id | attrs.subscriber_ids]

    ids = categorize_ids(invited, mentioned)

    Enum.reduce(ids, multi, fn {id, type}, multi ->
      name = "subscription_" <> id

      Multi.insert(multi, name, fn changes ->
        Subscription.changeset(%{
          subscription_list_id: changes.subscription_list.id,
          person_id: id,
          type: type,
        })
      end)
    end)
  end

  @doc """
  Finds people who are mentioned in a rich content and,
  if they don't have a subscription yet, creates it.

  Before calling update_mentioned_people/2,
  "subscription_list" and "subscription_list.subscriptions"
  must be part of multi.

  Example:
    Multi.run(multi, :subscription_list, fn _, _ ->
      SubscriptionList.get(:system, parent_id: parent.id, opts: [preload: :subscriptions]
    )
  """
  def update_mentioned_people(multi, content) do
    ids = RichContent.find_mentioned_ids(content, :decode_ids)

    Enum.reduce(ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if subscription_exists?(changes, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: id,
            type: :mentioned,
          })
        end
      end)
    end)
  end

  #
  # Helpers
  #

  def categorize_ids(invited, mentioned) do
    mentioned ++ invited
    |> Enum.uniq()
    |> Enum.map(fn id ->
      if Enum.member?(invited, id) do
        {id, :invited}
      else
        {id, :mentioned}
      end
    end)
  end

  defp subscription_exists?(changes, id) do
    Enum.any?(changes.subscription_list.subscriptions, &(&1.person_id == id))
  end
end
