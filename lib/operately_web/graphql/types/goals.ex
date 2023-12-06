defmodule OperatelyWeb.Graphql.Types.Goals do
  use Absinthe.Schema.Notation

  object :goal do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)

    field :timeframe, non_null(:string)

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

    field :my_role, :string do
      resolve fn goal, _, %{context: context} ->
        person = context.current_account.person
        role = Operately.Goals.get_role(goal, person)

        {:ok, Atom.to_string(role)}
      end
    end
  end
end
