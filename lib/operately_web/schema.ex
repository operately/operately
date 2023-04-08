defmodule OperatelyWeb.Schema do
  use Absinthe.Schema

  object :group do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
  end

  query do
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
  end

  mutation do
    field :create_group, :group do
      arg :name, non_null(:string)

      resolve fn args, _ ->
        {:ok, group} = Operately.Groups.create_group(%{
          name: args.name
        })

        {:ok, group}
      end
    end
  end

  subscription do
    field :group_added, :group do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end
  end
end
