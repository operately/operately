defmodule OperatelyWeb.Graphql.Queries.Assignments do
  use Absinthe.Schema.Notation
  
  alias Operately.People

  object :assignment_queries do
    field :assignments, non_null(:assignments) do
      arg :range_start, non_null(:datetime)
      arg :range_end, non_null(:datetime)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        assignments = People.get_assignments(person, args.range_start, args.range_end)

        {:ok, %{
          assignments: assignments
        }}
      end
    end
  end

end
