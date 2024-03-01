defmodule OperatelyWeb.Graphql.Mutations.ProjectCheckIns do
  use Absinthe.Schema.Notation

  input_object :post_project_check_in_input do
    field :project_id, non_null(:id)
    field :status, non_null(:string)
    field :description, non_null(:string)
  end

  input_object :edit_project_check_in_input do
    field :check_in_id, non_null(:id)
    field :status, non_null(:string)
    field :description, non_null(:string)
  end

  object :project_check_in_mutations do
    field :post_project_check_in, non_null(:project_check_in) do
      arg :input, non_null(:post_project_check_in_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        project_id = args.input.project_id
        status = args.input.status
        description = Jason.decode!(args.input.description)

        Operately.Operations.ProjectCheckIn.run(author, project_id, status, description)
      end
    end

    field :edit_project_check_in, non_null(:project_check_in) do
      arg :input, non_null(:edit_project_check_in_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        check_in_id = args.input.check_in_id
        status = args.input.status
        description = Jason.decode!(args.input.description)

        Operately.Operations.ProjectCheckInEdit.run(author, check_in_id, status, description)
      end
    end

    field :acknowledge_project_check_in, non_null(:project_check_in) do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        Operately.Operations.ProjectCheckInAcknowledgement.run(author, args.id)
      end
    end
  end
end
