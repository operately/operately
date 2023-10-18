defmodule OperatelyWeb.Graphql.Queries.Notifications do
  use Absinthe.Schema.Notation

  object :notification_queries do
    field :get_notification, :notification do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        
        raise "Not implemented"
      end
    end

    field :list_notifications, list_of(:notification) do
      arg :page, :integer
      arg :per_page, :integer

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        raise "Not implemented"
      end
    end
  end
end
