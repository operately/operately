defmodule OperatelyWeb.GraphQL.Types.Activities do
  use Absinthe.Schema.Notation

  object :activity do
    field :id, non_null(:id)
    field :resource_id, non_null(:id)
    field :resource_type, non_null(:string)
    field :action_type, non_null(:string)
    field :inserted_at, non_null(:naive_datetime)
    field :updated_at, non_null(:naive_datetime)

    field :resource, non_null(:activity_resource_union) do
      resolve fn activity, _, _ ->
        {:ok, activity.resource}
      end
    end

    field :person, non_null(:person) do
      resolve fn activity, _, _ ->
        {:ok, activity.person}
      end
    end
  end

  union :activity_resource_union do
    types [:project, :update]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
      %Operately.Updates.Update{}, _ -> :update
    end
  end

end
