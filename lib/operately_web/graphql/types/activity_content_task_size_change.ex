defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskSizeChange do
  use Absinthe.Schema.Notation

  object :activity_content_task_size_change do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :space_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["space_id"]}
      end
    end
    
    
    field :task_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["task_id"]}
      end
    end
    
    
    field :old_size, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_size"]}
      end
    end
    
    
    field :new_size, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_size"]}
      end
    end
    
  end
end
