defmodule OperatelyWeb.GraphQL.Types.Dashboards do
  use Absinthe.Schema.Notation

  object :dashboard do
    field :id, non_null(:id)
    field :panels, list_of(:panel)
  end

  object :panel do
    field :id, non_null(:id)
    field :type, :string
    field :index, :integer

    field :linked_resource, :panel_linked_resource do
      resolve fn resource, _, _ ->
        if resource.linked_resource_id == nil do
          {:ok, nil}
        else
          project = Operately.Projects.get_project!(resource.linked_resource_id)

          {:ok, project}
        end
      end
    end
  end

  union :panel_linked_resource do
    types [:project]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
    end
  end
end
