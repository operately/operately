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

    field :archived_at, :date do
      resolve fn goal, _, _ ->
        {:ok, goal.deleted_at}
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

    field :targets, list_of(:target) do
      resolve fn goal, _, _ ->
        {:ok, Operately.Goals.list_targets(goal.id)}
      end
    end

    field :projects, list_of(:project) do
      resolve fn goal, _, %{context: context} ->
        person = context.current_account.person
        
        {:ok, Operately.Projects.list_projects(person, %{goal_id: goal.id})}
      end
    end
  end

  object :target do
    field :id, non_null(:id)
    field :index, non_null(:integer)
    field :name, non_null(:string)
    field :from, non_null(:float)
    field :to, non_null(:float)
    field :unit, non_null(:string)
  end
end
