defimpl OperatelyWeb.Api.Serializable, for: Operately.Notifications.Subscriber do
  def serialize(subscriber, level: :essential) do
    %{
      role: subscriber.role,
      priority: subscriber.priority,
      person: OperatelyWeb.Api.Serializer.serialize(subscriber.person),
    }
  end
end
