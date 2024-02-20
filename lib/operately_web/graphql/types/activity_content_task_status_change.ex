defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskStatusChange do
  use Absinthe.Schema.Notation

  object :activity_content_task_status_change do
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
    
    
    field :status, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["status"]}
      end
    end
    
  end
end
