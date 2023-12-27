defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectContributorAddition do
  use Absinthe.Schema.Notation

  object :activity_content_project_contributor_addition do
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
    
    
    field :person_id, non_null(:string) do
      resolve fn activity, _, _ ->
        {:ok, activity.content["person_id"]}
      end
    end

    field :person, non_null(:person) do
      resolve fn activity, _, _ ->
        {:ok, Operately.People.get_person!(activity.content["person_id"])}
      end
    end

    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Projects.get_project!(activity.content["project_id"])}
      end
    end
  end
end
