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

    field :milestone, non_null(:milestone) do
      resolve fn task, _, _ ->
        milestone = Operately.Repo.preload(task, :milestone).milestone

        {:ok, milestone}
      end
    end

    field :project, non_null(:project) do
      resolve fn task, _, _ ->
        project = Operately.Repo.preload(task, [milestone: :project]).milestone.project

        {:ok, project}
      end
    end

    field :description, :string do
      resolve fn task, _, _ ->
        {:ok, task.description && Jason.encode!(task.description)}
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
