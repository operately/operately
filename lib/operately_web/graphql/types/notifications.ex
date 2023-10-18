defmodule OperatelyWeb.Graphql.Types.Notifications do
  use Absinthe.Schema.Notation

  object :notification do
    field :author, non_null(:person)
    field :activity, non_null(:activity)
    field :read, non_null(:boolean)
    field :read_at, non_null(:datetime)
    field :email_sent, non_null(:boolean)
    field :should_send_email, non_null(:boolean)
  end
end
