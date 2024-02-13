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

  input_object :edit_task_name_input do
    field :id, non_null(:id)
    field :name, non_null(:string)
  end

  input_object :close_task_input do
    field :task_id, non_null(:string)
  end

  input_object :reopen_task_input do
    field :task_id, non_null(:string)
  end

  input_object :change_task_priority_input do
    field :task_id, non_null(:string)
field :priority, non_null(:string)
  end


  input_object :change_task_size_input do
    field :task_id, non_null(:string)
field :size, non_null(:string)
  end


  object :task_mutations do
    field :change_task_size, non_null(:task) do
      arg :input, non_null(:change_task_size_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person

        case Operately.Operations.TaskSizeChange.run(author, input) do
          {:ok, result} -> {:ok, result}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end

    field :change_task_priority, non_null(:task) do
      arg :input, non_null(:change_task_priority_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id
        priority = input.priority

        case Operately.Operations.TaskPriorityChange.run(author, task_id, priority) do
          {:ok, result} -> {:ok, result}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end

    field :reopen_task, non_null(:task) do
      arg :input, non_null(:reopen_task_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id

        case Operately.Operations.TaskReopening.run(author, task_id) do
          {:ok, result} -> {:ok, result}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end

    field :close_task, non_null(:task) do
      arg :input, non_null(:close_task_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.task_id

        case Operately.Operations.TaskClosing.run(author, task_id) do
          {:ok, result} -> {:ok, result}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end

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

    field :edit_task_name, non_null(:task) do
      arg :input, non_null(:edit_task_name_input)

      resolve fn %{input: input}, %{context: context} ->
        author = context.current_account.person
        task_id = input.id
        name = input.name

        case Operately.Operations.TaskNameEditing.run(author, task_id, name) do
          {:ok, task} -> {:ok, task}
          {:error, changeset} -> {:error, changeset}
        end
      end
    end
  end
end
