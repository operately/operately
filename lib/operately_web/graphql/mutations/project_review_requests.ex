defmodule OperatelyWeb.GraphQL.Mutations.ProjectReviewRequests do
  use Absinthe.Schema.Notation

  input_object :create_project_review_request_input do
    field :project_id, non_null(:id)
    field :content, non_null(:string)
  end

  object :project_review_request_mutations do
    field :create_project_review_request, :project_review_request do
      arg :input, non_null(:create_project_review_request_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        content = Jason.decode!(args.input.content)

        Operately.Projects.create_review_request(author, %{
          project_id: args.input.project_id,
          author_id: author.id,
          content: content
        })
      end
    end
  end
end
