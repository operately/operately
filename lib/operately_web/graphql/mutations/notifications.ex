defmodule OperatelyWeb.Graphql.Mutations.Notifications do
  use Absinthe.Schema.Notation

  input_object :notification_input do
    field :field1, non_null(:string)
  end

  object :notification_mutations do
    field :create_notification, :notification do
      arg :input, non_null(:notification_input)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        raise "Not implemented"
      end
    end

    field :remove_notification, :notification do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        raise "Not implemented"
      end
    end
  end
end
