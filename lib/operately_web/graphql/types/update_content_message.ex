defmodule OperatelyWeb.GraphQL.Types.UpdateContentMessage do
  use Absinthe.Schema.Notation

  object :update_content_message do
    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end
  end
end
