defmodule OperatelyWeb.GraphQL.Types.Milestones do
  use Absinthe.Schema.Notation

  object :milestone do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :deadline_at, :date
    field :status, non_null(:string)
    field :phase, non_null(:string)

    field :project, non_null(:project) do
      resolve fn milestone, _, _ ->
        milestone = Operately.Repo.preload(milestone, :project)

        {:ok, milestone.project}
      end
    end
  end
end
