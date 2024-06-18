defmodule OperatelyWeb.Graphql.Queries.Groups do
  use Absinthe.Schema.Notation

  object :group_queries do
    field :potential_group_members, list_of(:person) do
      arg :group_id, non_null(:id)
      arg :query, :string
      arg :exclude_ids, list_of(:id)
      arg :limit, :integer

      resolve fn args, _ ->
        people = Operately.Groups.list_potential_members(
          args.group_id,
          args.query,
          args.exclude_ids,
          args.limit
        )

        {:ok, people}
      end
    end
  end
end
