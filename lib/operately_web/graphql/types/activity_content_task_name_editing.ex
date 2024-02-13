defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskNameEditing do
  use Absinthe.Schema.Notation

  object :activity_content_task_name_editing do
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
    
    
    field :old_name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["old_name"]}
      end
    end
    
    
    field :new_name, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["new_name"]}
      end
    end
    
  end
end
