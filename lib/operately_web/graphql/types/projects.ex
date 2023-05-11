defmodule OperatelyWeb.GraphQL.Types.Projects do
  use Absinthe.Schema.Notation

  object :project do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
    field :updated_at, non_null(:date)

    field :started_at, :date
    field :deadline, :date

    field :owner, :person do
      resolve fn project, _, _ ->
        person = Operately.Projects.get_owner!(project)

        {:ok, person}
      end
    end

    field :milestones, list_of(:milestone) do
      resolve fn project, _, _ ->
        milestones = Operately.Projects.list_project_milestones(project)

        {:ok, milestones}
      end
    end
  end
end
