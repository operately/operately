defmodule OperatelyWeb.Graphql.Mutations.Tasks do
  use Absinthe.Schema.Notation

  input_object :create_task_input do
    field :name, non_null(:string)
    field :assignee_ids, list_of(:string)
    field :description, :string
    field :milestone_id, :id
  end

  input_object :change_task_description_input do
    field :task_id, non_null(:string)
    field :description, non_null(:string)
  end

  input_object :update_task_status_input do
    field :task_id, non_null(:string)
    field :status, non_null(:string)
    field :column_index, non_null(:integer)
  end

  input_object :update_task_input do
    field :task_id, non_null(:string)
    field :name, non_null(:string)
    field :assigned_ids, non_null(list_of(:string))
  end


  object :task_mutations do
    field :create_task, :task do
      arg :input, non_null(:create_task_input)
      resolve fn %{input: input}, %{context: context} ->
        creator = context.current_account.person

        Operately.Operations.TaskAdding.run(creator, input)
      end
    end

    field :change_task_description, non_null(:task) do
      arg :input, non_null(:change_task_description_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id
        description = input.description && Jason.decode!(input.description)

        Operately.Operations.TaskDescriptionChange.run(author, task_id, description)
      end
    end

    field :update_task, non_null(:task) do
      arg :input, non_null(:update_task_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id
        name = input.name
        assigned_ids = input.assigned_ids

        Operately.Operations.TaskUpdate.run(author, task_id, name, assigned_ids)
      end
    end

    field :update_task_status, non_null(:task) do
      arg :input, non_null(:update_task_status_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id
        status = input.status
        column_index = input.column_index

        Operately.Operations.TaskStatusChange.run(author, task_id, status, column_index)
      end
    end
  end
end
