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
  end
end
