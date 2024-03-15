defmodule OperatelyWeb.Graphql.Types.Goals do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :goal do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)
    field :timeframe, non_null(:string)
    field :next_update_scheduled_at, :date
    field :parent_goal_id, :id

    json_field :description, :string

    assoc_field :champion, :person
    assoc_field :reviewer, :person

    assoc_field :targets, list_of(:target)
    assoc_field :projects, list_of(:project)
    assoc_field :parent_goal, :goal

    field :last_check_in, :update do
      resolve fn goal, _, _ ->
        {:ok, Operately.Updates.get_last_goal_check_in(goal.id)}
      end
    end

    field :permissions, non_null(:goal_permissions) do
      resolve fn goal, _, %{context: context} ->
        person = context.current_account.person

        {:ok, Operately.Goals.get_permissions(goal, person)}
      end
    end

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

    field :my_role, :string do
      resolve fn goal, _, %{context: context} ->
        person = context.current_account.person
        role = Operately.Goals.get_role(goal, person)

        {:ok, Atom.to_string(role)}
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
    field :value, non_null(:float)
  end
end
