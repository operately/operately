defmodule OperatelyWeb.Graphql.Types.Goals do
  use Absinthe.Schema.Notation

  object :goal do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)
    field :private, non_null(:boolean)

    field :is_archived, non_null(:boolean) do
      resolve fn goal, _, _ ->
        {:ok, goal.deleted_at != nil}
      end
    end

    # field :champion, :person do
    #   resolve fn project, _, _ ->
    #     {:ok, Goals.get_person_by_role(project, :champion)}
    #   end
    # end

    # field :reviewer, :person do
    #   resolve fn project, _, _ ->
    #     {:ok, Goals.get_person_by_role(project, :reviewer)}
    #   end
    # end

    # field :contributors, list_of(:goal_contributor) do
    #   resolve fn goal, _, _ ->
    #     {:ok, Goals.get_contributors(goal)}
    #   end
    # end
  end

end
