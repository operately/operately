defmodule OperatelyWeb.Graphql.Queries.ProjectCheckIns do
  use Absinthe.Schema.Notation

  object :project_check_in_queries do
    field :project_check_in, non_null(:project_check_in) do
      arg :id, :id

      resolve fn _, args, _ ->
        check_in = Operately.Projects.get_check_in!(args.id)

        {:ok, check_in}
      end
    end
  end
end
