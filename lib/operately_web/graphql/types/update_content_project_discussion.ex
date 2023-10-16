defmodule OperatelyWeb.GraphQL.Types.UpdateContentProjectDiscussion do
  use Absinthe.Schema.Notation

  object :update_content_project_discussion do
    field :title, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["title"])}
      end
    end

    field :body, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["body"])}
      end
    end
  end
end
