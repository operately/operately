defmodule Operately.Notifications do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Access.Fetch
  alias Operately.Notifications.{EmailBatch, Notification}

  def list_notifications do
    Repo.all(Notification)
  end

  def list_notifications(ids) when is_list(ids) do
    from(n in Notification, where: n.id in ^ids)
    |> Repo.all()
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

  def mark_as_read(notifications, person) when is_list(notifications) do
    now = DateTime.utc_now()
    ids = Enum.map(notifications, &(&1.id))

    from(n in Notification, where: n.id in ^ids and n.person_id == ^person.id)
    |> Repo.update_all([set: [read: true, read_at: now]])

    OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person.id}")

    {:ok, true}
  end

  def mark_all_as_read(person) do
    now = DateTime.utc_now()

    query = from n in Notification, where: n.person_id == ^person.id and n.read == false

    Repo.update_all(query, [set: [read: true, read_at: now]])

    OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person.id}")

    {:ok, true}
  end

  defdelegate bulk_create(notifications), to: Operately.Operations.NotificationsBulkCreate, as: :run

  def unread_notifications_count(person) do
    query = from n in Notification,
      where: n.person_id == ^person.id and n.read == false,
      select: count(n.id)

    Repo.one(query)
  end

  def list_email_batches do
    Repo.all(EmailBatch)
  end

  def get_email_batch!(id), do: Repo.get!(EmailBatch, id)

  def create_email_batch(attrs \\ %{}) do
    %EmailBatch{}
    |> EmailBatch.changeset(attrs)
    |> Repo.insert()
  end

  def update_email_batch(%EmailBatch{} = email_batch, attrs) do
    email_batch
    |> EmailBatch.changeset(attrs)
    |> Repo.update()
  end

  def change_email_batch(%EmailBatch{} = email_batch, attrs \\ %{}) do
    EmailBatch.changeset(email_batch, attrs)
  end

  alias Operately.Notifications.SubscriptionList

  def get_subscription_list_with_access_level(id, type, person_id) when type in [:resource_hub_document, :resource_hub_file, :resource_hub_link] do
    fetch_resource_hub_subscription_list_with_access_level(id, type, person_id)
  end

  def get_subscription_list_with_access_level(id, type, person_id) do
    case type do
      :project_check_in ->
        from(c in Operately.Projects.CheckIn, as: :resource,
          join: s in assoc(c, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :project_retrospective ->
        from(r in Operately.Projects.Retrospective, as: :resource,
          join: s in assoc(r, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :goal_update ->
        from(u in Operately.Goals.Update, as: :resource,
          join: s in assoc(u, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :message ->
        from(m in Operately.Messages.Message, as: :resource,
          join: s in assoc(m, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :resource_hub_document ->
        from(d in Operately.ResourceHubs.Document, as: :resource,
          join: s in assoc(d, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :resource_hub_file ->
        from(f in Operately.ResourceHubs.File, as: :resource,
          join: s in assoc(f, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :resource_hub_link ->
        from(l in Operately.ResourceHubs.Link, as: :resource,
          join: s in assoc(l, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :project ->
        from(p in Operately.Projects.Project, as: :resource,
          join: s in assoc(p, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :milestone ->
        from(m in Operately.Projects.Milestone, as: :resource,
          join: s in assoc(m, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :project_task ->
        from(t in Operately.Tasks.Task, as: :resource,
          join: s in assoc(t, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :space_task ->
        from(t in Operately.Tasks.Task, as: :resource,
          join: s in assoc(t, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
      :comment_thread ->
        from(a in Operately.Activities.Activity, as: :resource,
          join: c in assoc(a, :comment_thread),
          join: s in assoc(c, :subscription_list), as: :subscription_list,
          where: s.id == ^id
        )
    end
    |> Fetch.get_resource_with_access_level(person_id, selected_resource: :subscription_list)
  end

  def get_subscription_list_access_level(id, type, person_id) when type in [:resource_hub_document, :resource_hub_file, :resource_hub_link] do
    fetch_resource_hub_subscription_list_access_level(id, type, person_id)
  end

  def get_subscription_list_access_level(id, type, person_id) do
    query = case type do
      :project_check_in ->
        from(c in Operately.Projects.CheckIn, as: :resource,
          join: s in assoc(c, :subscription_list),
          where: s.id == ^id
        )
      :project_retrospective ->
        from(r in Operately.Projects.Retrospective, as: :resource,
          join: s in assoc(r, :subscription_list),
          where: s.id == ^id
        )
      :goal_update ->
        from(c in Operately.Goals.Update, as: :resource,
          join: s in assoc(c, :subscription_list),
          where: s.id == ^id
        )
      :message ->
        from(m in Operately.Messages.Message, as: :resource,
          join: s in assoc(m, :subscription_list),
          where: s.id == ^id
        )
      :resource_hub_document ->
        from(d in Operately.ResourceHubs.Document, as: :resource,
          join: s in assoc(d, :subscription_list),
          where: s.id == ^id
        )
      :resource_hub_file ->
        from(f in Operately.ResourceHubs.File, as: :resource,
          join: s in assoc(f, :subscription_list),
          where: s.id == ^id
        )
      :resource_hub_link ->
        from(l in Operately.ResourceHubs.Link, as: :resource,
          join: s in assoc(l, :subscription_list),
          where: s.id == ^id
        )
      :project ->
        from(p in Operately.Projects.Project, as: :resource,
          join: s in assoc(p, :subscription_list),
          where: s.id == ^id
        )
      :project_task ->
        from(t in Operately.Tasks.Task,
          join: p in assoc(t, :project), as: :resource,
          join: s in assoc(t, :subscription_list),
          where: s.id == ^id
        )
      :space_task ->
        from(t in Operately.Tasks.Task,
          join: g in assoc(t, :space), as: :resource,
          join: s in assoc(t, :subscription_list),
          where: s.id == ^id
        )
      :milestone ->
        from(m in Operately.Projects.Milestone, as: :resource,
          join: s in assoc(m, :subscription_list),
          where: s.id == ^id
        )
      :comment_thread ->
        from(a in Operately.Activities.Activity, as: :resource,
          join: c in assoc(a, :comment_thread),
          join: s in assoc(c, :subscription_list),
          where: s.id == ^id
        )
    end

    {:ok, Fetch.get_access_level(query, person_id)}
  end

  defp fetch_resource_hub_subscription_list_with_access_level(id, type, person_id) do
    module = resource_hub_subscription_module(type)

    with resource_id when not is_nil(resource_id) <- fetch_resource_hub_resource_id(id, module),
         {:ok, resource} <- module.get(person_id, id: resource_id, opts: [preload: :subscription_list]) do
      {:ok, SubscriptionList.set_requester_access_level(resource.subscription_list, resource.request_info.access_level)}
    else
      nil -> {:error, :not_found}
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp fetch_resource_hub_subscription_list_access_level(id, type, person_id) do
    module = resource_hub_subscription_module(type)

    with resource_id when not is_nil(resource_id) <- fetch_resource_hub_resource_id(id, module),
         {:ok, resource} <- module.get(person_id, id: resource_id) do
      {:ok, resource.request_info.access_level}
    else
      _ -> {:ok, Operately.Access.Binding.no_access()}
    end
  end

  defp resource_hub_subscription_module(:resource_hub_document), do: Operately.ResourceHubs.Document
  defp resource_hub_subscription_module(:resource_hub_file), do: Operately.ResourceHubs.File
  defp resource_hub_subscription_module(:resource_hub_link), do: Operately.ResourceHubs.Link

  defp fetch_resource_hub_resource_id(subscription_list_id, module) do
    from(r in module,
      join: s in assoc(r, :subscription_list),
      where: s.id == ^subscription_list_id,
      select: r.id
    )
    |> Repo.one()
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

  def delete_subscription(%Subscription{} = subscription) do
    Repo.delete(subscription)
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
