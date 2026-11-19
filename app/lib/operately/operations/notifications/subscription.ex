defmodule Operately.Operations.Notifications.Subscription do
  alias Ecto.Multi
  alias Operately.{Notifications, Repo, RichContent}
  alias Operately.Notifications.Subscription

  def insert(multi, author, attrs) do
    mentioned = RichContent.find_mentioned_ids(attrs.content, :decode_ids)
    invited = [author.id | attrs.subscriber_ids]

    ids = categorize_ids(invited, mentioned)

    Enum.reduce(ids, multi, fn {id, type}, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        ensure_subscription(changes.subscription_list.id, id, type)
      end)
    end)
  end

  @doc "Creates a subscription if missing, leaving existing subscriptions (including cancellations) unchanged."
  def insert_if_missing(subscription_list_id, person_id, type) do
    changeset = Subscription.changeset(%{
      subscription_list_id: subscription_list_id,
      person_id: person_id,
      type: type,
    })

    with {:ok, _} <- Repo.insert(changeset, on_conflict: :nothing, conflict_target: [:subscription_list_id, :person_id]) do
      Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id)
    end
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

  defp ensure_subscription(subscription_list_id, person_id, type) do
    with {:ok, subscription} <- insert_if_missing(subscription_list_id, person_id, type) do
      if subscription.canceled do
        Notifications.update_subscription(subscription, %{canceled: false, type: type})
      else
        {:ok, subscription}
      end
    end
  end
end
