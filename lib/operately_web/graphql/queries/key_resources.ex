defmodule OperatelyWeb.Graphql.Queries.KeyResources do
  use Absinthe.Schema.Notation

  object :key_resource_queries do
    field :key_resource, :project_key_resource do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        resource = Operately.Projects.get_key_resource!(args.id)

        {:ok, resource}
      end
    end
  end
end
