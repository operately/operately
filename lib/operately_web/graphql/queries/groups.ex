defmodule OperatelyWeb.GraphQL.Queries.Groups do
  use Absinthe.Schema.Notation

  object :group_queries do
    field :groups, list_of(:group) do
      resolve fn _, _, _ ->
        groups = Operately.Groups.list_groups()

        {:ok, groups}
      end
    end

    field :group, :group do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.id)

        {:ok, group}
      end
    end

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
