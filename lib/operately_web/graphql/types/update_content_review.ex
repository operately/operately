defmodule OperatelyWeb.Graphql.Types.UpdateContentReview do
  use Absinthe.Schema.Notation

  object :update_content_review do
    field :survey, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["survey"])}
      end
    end

    field :previous_phase, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["previous_phase"] || update.previous_phase}
      end
    end

    field :new_phase, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["new_phase"] || update.new_phase}
      end
    end

    field :review_reason, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["review_reason"]}
      end
    end

    field :review_request_id, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["review_request_id"]}
      end
    end
  end
end
