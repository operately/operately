defmodule OperatelyWeb.Graphql.Mutations.Tasks do
  use Absinthe.Schema.Notation

  input_object :change_task_description_input do
    field :task_id, non_null(:string)
    field :description, non_null(:string)
  end

  input_object :update_task_input do
    field :task_id, non_null(:string)
    field :name, non_null(:string)
    field :assigned_ids, non_null(list_of(:string))
  end


  object :task_mutations do
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
  end
end
