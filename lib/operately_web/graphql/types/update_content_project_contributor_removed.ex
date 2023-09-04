defmodule OperatelyWeb.GraphQL.Types.UpdateContentProjectContributorRemoved do
  use Absinthe.Schema.Notation

  object :update_content_project_contributor_removed do
    field :contributor, non_null(:person) do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.content["contributor_id"])
        {:ok, person}
      end
    end

    field :contributor_id, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["contributor_id"]}
      end
    end
    
    field :contributor_role, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["contributor_role"]}
      end
    end
  end
end
