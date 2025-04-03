defimpl OperatelyWeb.Api.Serializable, for: Operately.Notifications.SubscriptionList do
  def serialize(subscription_list, level: :essential) do
    %{
      id: OperatelyWeb.Paths.subscription_list_id(subscription_list),
      parent_type: subscription_list.parent_type,
      send_to_everyone: subscription_list.send_to_everyone,
      subscriptions: OperatelyWeb.Api.Serializer.serialize(subscription_list.subscriptions),
    }
  end

  def serialize(subscription_list, level: :full) do
    serialize(subscription_list, level: :essential)
  end
end
