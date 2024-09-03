defimpl OperatelyWeb.Api.Serializable, for: Operately.Notifications.Subscription do
  def serialize(subscription, level: :essential) do
    %{
      id: OperatelyWeb.Paths.subscription_id(subscription),
      type: subscription.type,
      person: OperatelyWeb.Api.Serializer.serialize(subscription.person),
    }
  end

  def serialize(subscription, level: :full) do
    serialize(subscription, level: :essential)
  end
end
