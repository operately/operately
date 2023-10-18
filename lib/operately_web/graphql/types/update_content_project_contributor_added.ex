defmodule OperatelyWeb.Graphql.Types.UpdateContentProjectContributorAdded do
  use Absinthe.Schema.Notation

  object :update_content_project_contributor_added do
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

    field :contributor, non_null(:person) do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.content["contributor_id"])

        {:ok, person}
      end
    end
  end
end
