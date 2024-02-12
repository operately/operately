defmodule OperatelyWeb.Graphql.Mutations.Tasks do
  use Absinthe.Schema.Notation

  input_object :create_task_input do
    field :space_id, non_null(:id)
    field :name, non_null(:string)
    field :assignee_id, non_null(:id)
    field :due_date, :naive_datetime
    field :description, :string
    field :priority, :string
    field :size, :string
  end

  object :task_mutations do
    field :create_task, :task do
      arg :input, non_null(:create_task_input)
      resolve fn %{input: input}, %{context: context} ->
        creator = context.current_account.person

        case Operately.Operations.TaskAdding.run(creator, input) do
          {:ok, task} -> {:ok, task}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end
  end
end
