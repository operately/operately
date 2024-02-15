defmodule OperatelyWeb.Graphql.Types.Tasks do
  use Absinthe.Schema.Notation

  object :task do
    field :id, non_null(:id)
    field :name, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)
    field :due_date, :date

    field :size, :string
    field :priority, :string
    field :status, non_null(:string)

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

    field :assignees, list_of(non_null(:person)) do
      resolve fn task, _, _ ->
        people = Operately.Repo.preload(task, [assignees: :person]).assignees |> Enum.map(& &1.person)

        {:ok, people}
      end
    end
    
    field :creator, non_null(:person) do
      resolve fn task, _, _ ->
        {:ok, Operately.People.get_person!(task.creator_id)}
      end
    end
  end
end
