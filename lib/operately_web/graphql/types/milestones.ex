defmodule OperatelyWeb.Graphql.Types.Milestones do
  use Absinthe.Schema.Notation

  object :milestone do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :status, non_null(:string)
    field :inserted_at, :date

    field :deadline_at, :date
    field :completed_at, :date
    field :description, :string do
      resolve fn milestone, _, _ ->
        {:ok, milestone.description && Jason.encode!(milestone.description)}
      end
    end

    field :comments, list_of(:milestone_comment) do
      resolve fn milestone, _, _ ->
        {:ok, Operately.Comments.list_milestone_comments(milestone.id)}
      end
    end
  end

  object :milestone_comment do
    field :id, non_null(:id)
    field :action, non_null(:string)
    field :comment, non_null(:comment)
  end
end
