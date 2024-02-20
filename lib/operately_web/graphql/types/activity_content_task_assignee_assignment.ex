defmodule OperatelyWeb.Graphql.Types.ActivityContentTaskAssigneeAssignment do
  use Absinthe.Schema.Notation

  object :activity_content_task_assignee_assignment do
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
    
    
    field :person_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["person_id"]}
      end
    end
    
  end
end
