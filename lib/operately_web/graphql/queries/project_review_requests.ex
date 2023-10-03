defmodule OperatelyWeb.GraphQL.Queries.ProjectReviewRequests do
  use Absinthe.Schema.Notation

  object :project_review_request_queries do
    field :project_review_request, non_null(:project_review_request) do
      arg :id, non_null(:id)
      resolve fn args, _ ->
        Operately.Projects.get_review_request(args.id)
      end
    end
  end
end
