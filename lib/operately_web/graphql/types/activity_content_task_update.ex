defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskUpdate do
  use Absinthe.Schema.Notation

  object :activity_content_task_update do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :task_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["task_id"]}
      end
    end
    
    
    field :name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["name"]}
      end
    end
    
  end
end
