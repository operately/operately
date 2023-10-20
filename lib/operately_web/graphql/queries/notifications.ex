defmodule OperatelyWeb.Graphql.Queries.Notifications do
  use Absinthe.Schema.Notation

  object :notification_queries do
    field :notification, :notification do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        
        raise "Not implemented"
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

        {:ok, notifications}
      end
    end
  end
end
