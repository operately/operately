defmodule OperatelyWeb.Graphql.Subscriptions.Notifications do
  use Absinthe.Schema.Notation

  object :notification_subscriptions do
    field :on_unread_notification_count_changed, :boolean do
      config fn _args, %{context: context} ->
        person = context.current_account.person

        {:ok, topic: "notifications:#{person.id}"}
      end
    end
  end
end
