defmodule OperatelyWeb.Graphql.Types.Assignments do
  use Absinthe.Schema.Notation

  object :assignments do
    field :assignments, list_of(:assignment)
  end

  object :assignment do
    field :type, non_null(:string)
    field :due, non_null(:date)
    field :resource, non_null(:assignment_resource)
  end

  union :assignment_resource do
    types [
      :project,
      :milestone
    ]

    resolve_type fn
      %Operately.Projects.Project{}, _ -> :project
      %Operately.Projects.Milestone{}, _ -> :milestone
    end
  end

end
