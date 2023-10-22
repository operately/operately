defmodule OperatelyWeb.Graphql.Queries.Notifications do
  use Absinthe.Schema.Notation

  object :notification_queries do
    field :unread_notifications_count, :integer do
      resolve fn _, %{context: %{current_account: current_account}} ->
        {:ok, Operately.Notifications.unread_notifications_count(current_account.person)}
      end
    end

    field :notifications, list_of(non_null(:notification)) do
      arg :page, :integer
      arg :per_page, :integer

      resolve fn args, %{context: context} ->
        notifications = Operately.Notifications.list_notifications(
          context.current_account.person,
          page: args.page, 
          per_page: args.per_page
        )

        notifications = Operately.Repo.preload(notifications, [activity: [:author]])

        {:ok, notifications}
      end
    end
  end
end
