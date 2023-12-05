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

    field :space, non_null(:group) do
      resolve fn goal, _, _ ->
        {:ok, Operately.Groups.get_group!(goal.group_id)}
      end
    end

    field :champion, :person do
      resolve fn goal, _, _ ->
        {:ok, Operately.People.get_person!(goal.champion_id)}
      end
    end

    field :reviewer, :person do
      resolve fn goal, _, _ ->
        {:ok, Operately.People.get_person!(goal.reviewer_id)}
      end
    end
  end

end
