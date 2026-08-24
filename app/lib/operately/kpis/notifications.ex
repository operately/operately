defmodule Operately.Kpis.Notifications do
  @moduledoc """
  Notification fan-out helpers for KPI activities.
  """

  alias Operately.Access
  alias Operately.Groups
  alias Operately.Groups.Group
  alias Operately.Notifications.SubscribersLoader
  alias Operately.Notifications.Subscription

  def notify_space_members(activity) do
    space = Groups.get_group(activity.content["space_id"])

    members =
      case space do
        %Group{} -> Groups.list_members(space)
        _ -> []
      end

    members
    |> Enum.map(& &1.id)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.uniq()
    |> Enum.map(fn id ->
      %{person_id: id, activity_id: activity.id, should_send_email: false}
    end)
    |> Operately.Notifications.bulk_create()
  end

  def notify_subscribers(activity) do
    kpi = Operately.Kpis.get_kpi(activity.content["kpi_id"])

    case kpi do
      nil ->
        {:ok, []}

      kpi ->
        kpi
        |> get_subscribers(ignore: [activity.author_id])
        |> Enum.map(fn id ->
          %{person_id: id, activity_id: activity.id, should_send_email: false}
        end)
        |> Operately.Notifications.bulk_create()
    end
  end

  def get_subscribers(kpi, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    access_context = Access.get_context!(group_id: kpi.space_id)

    kpi
    |> Map.put(:access_context, access_context)
    |> SubscribersLoader.load_for_notifications([], ignore)
  end

  def ensure_subscription(nil, _person_id, _type), do: {:ok, nil}
  def ensure_subscription(_subscription_list_id, nil, _type), do: {:ok, nil}

  def ensure_subscription(subscription_list_id, person_id, type) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        Operately.Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: type
        })

      {:ok, subscription} ->
        Operately.Notifications.update_subscription(subscription, %{canceled: false})
    end
  end
end
