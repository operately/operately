defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectStatusUpdateEdit do
  use Absinthe.Schema.Notation

  object :activity_content_project_status_update_edit do
    field :company_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["company_id"]}
      end
    end
    
    
    field :project_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["project_id"]}
      end
    end
    
    
    field :check_in_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["check_in_id"]}
      end
    end
    
  end
end
