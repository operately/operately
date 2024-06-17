defmodule OperatelyWeb.Api.Queries.GetNotifications do
  use TurboConnect.Query

  alias Operately.Notifications.Notification
  alias Operately.Activities.Activity
  alias Operately.Activities.Preloader

  import Ecto.Query, only: [from: 2]

  inputs do
    field :page, :integer
    field :per_page, :integer
  end

  outputs do
    field :notifications, list_of(:notification)
  end

  @default_per_page 100

  def call(conn, inputs) do
    me = conn.assigns.current_account.person
    page = inputs[:page] || 1
    per_page = inputs[:per_page] || @default_per_page

    notifications = load(page, per_page, me)

    {:ok, %{notifications: serialize(notifications)}}
  end

  def load(page, per_page, me) do
    offset = per_page * (page - 1)
    limit = per_page

    query = from n in Notification,
      join: a in assoc(n, :activity),
      where: a.action not in ^Activity.deprecated_actions(),
      where: n.person_id == ^me.id,
      order_by: [desc: n.inserted_at],
      offset: ^offset,
      limit: ^limit,
      preload: [activity: [:author, :comment_thread]]

    query 
    |> Operately.Repo.all() 
    |> load_data_for_activities()
    |> inject_my_role_into_goals(me)
  end

  def load_data_for_activities(notifications) do
    activities = 
      notifications
      |> Enum.map(fn n -> n.activity end)
      |> Enum.map(&Operately.Activities.cast_content/1)
      |> Preloader.preload()

    Enum.map(notifications, fn notification ->
      activity = Enum.find(activities, fn a -> a.id == notification.activity_id end)

      %{notification | activity: activity}
    end)
  end

  def inject_my_role_into_goals(notifications, me) do
    goals = notifications |> find_all(Operately.Goals.Goal)
    goals_with_roles = goals |> Enum.map(fn g -> Map.put(g, :my_role, Operately.Goals.get_role(g, me)) end)

    inject(notifications, Operately.Goals.Goal, goals_with_roles)
  end

  def serialize(notifications) when is_list(notifications) do
    Enum.map(notifications, fn n -> serialize(n) end)
  end

  def serialize(notification = %Notification{}) do
    %{
      id: notification.id,
      inserted_at: notification.inserted_at,
      read: notification.read,
      read_at: notification.read_at,
      activity: OperatelyWeb.Api.Serializers.Activity.serialize(notification.activity, [comment_thread: :minimal])
    }
  end

  #
  # Deeply find all records of a given type in a nested structure and replace them with a new value
  #

  def find_all(records, type) when is_list(records) do
    Enum.map(records, fn record -> find_all(record, type) end) |> List.flatten() |> Enum.filter(& &1)
  end

  def find_all(record, type) when is_struct(record) do
    if record.__struct__ == type do
      record
    else
      Map.keys(Map.from_struct(record)) |> Enum.map(fn k -> find_all(Map.get(record, k), type) end)
    end
  end

  def find_all(_, _), do: nil

  def inject(records, type, data) when is_list(records) do
    Enum.map(records, fn record -> inject(record, type, data) end)
  end

  def inject(record, type, data) when is_struct(record) do
    if record.__struct__ == type do
      Enum.find(data, fn d -> d.id == record.id end)
    else
      keys = record |> Map.from_struct() |> Map.keys() 

      Enum.reduce(keys, record, fn k, acc -> 
        Map.put(acc, k, inject(Map.get(record, k), type, data))
      end)
    end
  end

  def inject(record, _, _), do: record
end
