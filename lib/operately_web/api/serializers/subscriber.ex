defimpl OperatelyWeb.Api.Serializable, for: Operately.Notifications.Subscriber do
  def serialize(subscriber, level: :essential) do
    %{
      role: subscriber.role,
      priority: subscriber.priority,
      is_subscribed: subscriber.is_subscribed,
      person: OperatelyWeb.Api.Serializer.serialize(subscriber.person),
    }
  end
end
