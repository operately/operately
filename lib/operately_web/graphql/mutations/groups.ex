defmodule OperatelyWeb.GraphQL.Mutations.Groups do
  use Absinthe.Schema.Notation

  object :group_mutations do
    field :create_group, :group do
      arg :name, non_null(:string)
      arg :mission, non_null(:string)

      resolve fn args, _ ->
        Operately.Groups.create_group(%{
          name: args.name,
          mission: args.mission
        })
      end
    end

    field :remove_group_member, :group do
      arg :group_id, non_null(:id)
      arg :member_id, non_null(:id)

      resolve fn args, _ ->
        group = Operately.Groups.get_group(args.group_id)

        Operately.Groups.remove_member(group, args.member_id)

        {:ok, group}
      end
    end
  end
end
