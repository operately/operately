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

    offset = per_page * (page - 1)
    limit = per_page

    query = from n in Notification,
      join: a in assoc(n, :activity),
      where: a.action not in ^Activity.deprecated_actions(),
      where: n.person_id == ^me.id,
      order_by: [desc: n.inserted_at],
      offset: ^offset,
      limit: ^limit,
      preload: [activity: [:author]]

    notifications = query |> Operately.Repo.all() |> load_data_for_activities()

    {:ok, %{notifications: notifications}}
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
end
