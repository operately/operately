defmodule OperatelyWeb.Graphql.Types.Notifications do
  use Absinthe.Schema.Notation

  object :notification do
    field :id, non_null(:id)

    field :activity, non_null(:activity) do
      resolve fn notification, _, _ ->
        {:ok, notification.activity}
      end
    end

    # field :read, non_null(:boolean)
    # field :read_at, non_null(:datetime)
    # field :email_sent, non_null(:boolean)
    # field :should_send_email, non_null(:boolean)
  end
end
