defmodule Operately.Notifications do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Access.Fetch
  alias Operately.Notifications.Notification

  def list_notifications do
    Repo.all(Notification)
  end

  def get_notification!(id), do: Repo.get!(Notification, id)

  def create_notification(attrs \\ %{}) do
    %Notification{}
    |> Notification.changeset(attrs)
    |> Repo.insert()
  end

  def update_notification(%Notification{} = notification, attrs) do
    notification
    |> Notification.changeset(attrs)
    |> Repo.update()
  end

  def delete_notification(%Notification{} = notification) do
    Repo.delete(notification)
  end

  def change_notification(%Notification{} = notification, attrs \\ %{}) do
    Notification.changeset(notification, attrs)
  end

  def mark_as_read(%Notification{} = notification) do
    {:ok, notification} = update_notification(notification, %{
      read: true,
      read_at: DateTime.utc_now()
    })

    OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{notification.person_id}")

    {:ok, notification}
  end

  def mark_all_as_read(person) do
    now = DateTime.utc_now()

    query = from n in Notification, where: n.person_id == ^person.id and n.read == false

    Repo.update_all(query, [set: [read: true, read_at: now]])

    OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person.id}")

    {:ok, true}
  end

  def bulk_create(notifications) do
    alias Ecto.Multi
    alias Operately.Notifications.EmailWorker

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    notifications = Enum.map(notifications, fn notification ->
      Map.merge(notification, %{inserted_at: now, updated_at: now})
    end)

    Multi.new()
    |> Multi.run(:notifications, fn repo, _ ->
      {_, notifications} = repo.insert_all(Notification, notifications, returning: [:id, :should_send_email, :person_id])
      {:ok, notifications}
    end)
    |> Multi.merge(fn %{notifications: notifications} ->
      Enum.reduce(notifications, Ecto.Multi.new(), fn notification, multi ->
        if notification.should_send_email do
          Ecto.Multi.run(multi, "email_#{notification.id}", fn _repo, _ ->
            EmailWorker.new(%{notification_id: notification.id}) |> Oban.insert()
          end)
        else
          multi
        end
      end)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{notifications: notifications}} ->
        unique_person_ids = Enum.uniq(Enum.map(notifications, &(&1.person_id)))

        Enum.each(unique_person_ids, fn person_id ->
          OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person_id}")
        end)

        {:ok, notifications}
      {:error, _} ->
        {:error, :failed_to_create_notifications}
    end
  end

  def unread_notifications_count(person) do
    query = from n in Notification,
      where: n.person_id == ^person.id and n.read == false,
      select: count(n.id)

    Repo.one(query)
  end


  alias Operately.Notifications.SubscriptionList

  def get_subscription_list!(id) when is_binary(id), do: Repo.get!(SubscriptionList, id)
  def get_subscription_list!(attrs) when is_list(attrs), do: Repo.get_by!(SubscriptionList, attrs)

  def get_subscription_list(id) when is_binary(id), do: Repo.get(SubscriptionList, id)
  def get_subscription_list(attrs) when is_list(attrs), do: Repo.get_by(SubscriptionList, attrs)

  def get_subscription_list_with_access_level(id, type, person_id) do
    case type do
      :project_check_in ->
        from(c in Operately.Projects.CheckIn, as: :resource,
          join: s in assoc(c, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
    end
    |> Fetch.get_resource_with_access_level(person_id, selected_resource: :subscription_list)
  end

  def get_subscription_list_access_level(id, type, person_id) do
    query = case type do
      :project_check_in ->
        from(c in Operately.Projects.CheckIn, as: :resource,
          join: s in assoc(c, :subscription_list),
          where: s.id == ^id
        )
    end

    {:ok, Fetch.get_access_level(query, person_id)}
  end

  def create_subscription_list(attrs \\ %{}) do
    %SubscriptionList{}
    |> SubscriptionList.changeset(attrs)
    |> Repo.insert()
  end

  def update_subscription_list(%SubscriptionList{} = subscription_list, attrs) do
    subscription_list
    |> SubscriptionList.changeset(attrs)
    |> Repo.update()
  end


  alias Operately.Notifications.Subscription

  def list_subscriptions(%SubscriptionList{} = subscription_list), do: list_subscriptions(subscription_list.id)
  def list_subscriptions(subscription_list_id) do
    from(s in Subscription, where: s.subscription_list_id == ^subscription_list_id)
    |> Repo.all()
  end

  def create_subscription(attrs \\ %{}) do
    %Subscription{}
    |> Subscription.changeset(attrs)
    |> Repo.insert()
  end

  def update_subscription(%Subscription{} = subscription, attrs) do
    subscription
    |> Subscription.changeset(attrs)
    |> Repo.update()
  end

  def is_subscriber?(person_id, subscription_list_id) do
    from(s in Subscription,
      where: s.person_id == ^person_id and s.subscription_list_id == ^subscription_list_id,
      where: not s.canceled
    )
    |> Repo.exists?()
  end
end
