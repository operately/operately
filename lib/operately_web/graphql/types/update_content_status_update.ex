defmodule OperatelyWeb.GraphQL.Types.UpdateContentStatusUpdate do
  use Absinthe.Schema.Notation

  object :update_content_status_update do
    field :message, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, Jason.encode!(update.content["message"])}
      end
    end

    field :old_health, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["old_health"] || ""}
      end
    end

    field :new_health, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["new_health"] || ""}
      end
    end
  end
end
