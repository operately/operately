defmodule OperatelyWeb.Graphql.Types.Discussions do
  use Absinthe.Schema.Notation

  object :discussion do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)

    field :title, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["title"])}
      end
    end

    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end
  end

end
