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

  @doc """
  Creates subscriptions for invited people (subscriber_ids).
  
  Before calling update_invited_people/2,
  "subscription_list" and "subscription_list.subscriptions"
  must be part of multi.
  """
  def update_invited_people(multi, subscriber_ids) when is_list(subscriber_ids) and length(subscriber_ids) > 0 do
    Enum.reduce(subscriber_ids, multi, fn id, multi ->
      name = "invited_subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if subscription_exists?(changes, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: id,
            type: :invited,
          })
        end
      end)
    end)
  end

  def update_invited_people(multi, _), do: multi

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
