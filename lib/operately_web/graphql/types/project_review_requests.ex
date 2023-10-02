defmodule OperatelyWeb.GraphQL.Types.ProjectReviewRequests do
  use Absinthe.Schema.Notation

  object :project_review_request do
    field :id, non_null(:id)
    field :author, non_null(:person)
    field :content, non_null(:string) do
      resolve fn req, _, _ ->
        {:ok, Jason.encode!(req.content)}
      end
    end
  end
end
