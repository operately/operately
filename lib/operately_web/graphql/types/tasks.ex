defmodule OperatelyWeb.Graphql.Types.Tasks do
  use Absinthe.Schema.Notation

  object :task do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)
    field :due_date, non_null(:date)

    field :size, non_null(:string)
    field :priority, non_null(:string)

    field :description, :string do
      resolve fn task, _, _ ->
        {:ok, task.description && Jason.encode!(task.description)}
      end
    end

    field :space, non_null(:group) do
      resolve fn task, _, _ ->
        {:ok, Operately.Groups.get_group!(task.space_id)}
      end
    end

    field :assignee, :person do
      resolve fn task, _, _ ->
        {:ok, Operately.People.get_person!(task.assignee_id)}
      end
    end
    
    field :creator, non_null(:person) do
      resolve fn task, _, _ ->
        {:ok, Operately.People.get_person!(task.creator_id)}
      end
    end
  end
end
