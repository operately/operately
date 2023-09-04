defmodule OperatelyWeb.GraphQL.Types.UpdateContentProjectEndTimeChanged do
  use Absinthe.Schema.Notation

  object :update_content_project_end_time_changed do
    field :old_end_time, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["old_end_time"]}
      end
    end
    
    field :new_end_time, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["new_end_time"]}
      end
    end
    
  end
end
