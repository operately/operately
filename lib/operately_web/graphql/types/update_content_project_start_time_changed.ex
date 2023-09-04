defmodule OperatelyWeb.GraphQL.Types.UpdateContentProjectStartTimeChanged do
  use Absinthe.Schema.Notation

  object :update_content_project_start_time_changed do
    field :old_start_time, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["old_start_time"]}
      end
    end
    
    field :new_start_time, non_null(:string) do
      resolve fn update, _, _ ->
        {:ok, update.content["new_start_time"]}
      end
    end
    
  end
end
