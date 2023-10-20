defmodule OperatelyWeb.Graphql.Mutations.Notifications do
  use Absinthe.Schema.Notation

  alias Operately.Notifications

  object :notification_mutations do
    field :mark_notification_as_read, non_null(:notification) do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        args.id
        |> Notifications.get_notification!()
        |> Notifications.mark_as_read()
      end
    end
  end
end
