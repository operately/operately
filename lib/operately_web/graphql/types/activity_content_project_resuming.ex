defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectResuming do
  use Absinthe.Schema.Notation

  object :activity_content_project_resuming do
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
    
  end
end
