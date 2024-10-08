defimpl OperatelyWeb.Api.Serializable, for: Operately.Notifications.Notification do
  def serialize(notification, level: :essential) do
    %{
      id: notification.id,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(notification.inserted_at),
      read: notification.read,
      read_at: OperatelyWeb.Api.Serializer.serialize(notification.read_at),
    }
  end

  def serialize(notification, level: :full) do
    %{
      id: notification.id,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(notification.inserted_at),
      read: notification.read,
      read_at: OperatelyWeb.Api.Serializer.serialize(notification.read_at),
      activity: OperatelyWeb.Api.Serializers.Activity.serialize(notification.activity, [comment_thread: :minimal])
    }
  end
end
