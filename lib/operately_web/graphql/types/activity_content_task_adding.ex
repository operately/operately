defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskAdding do
  use Absinthe.Schema.Notation

  object :activity_content_task_adding do
    field :name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["name"]}
      end
    end
    
    
    field :task_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["task_id"]}
      end
    end
    
    
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
    
  end
end
