defmodule OperatelyWeb.Graphql.Types.Groups do
  use Absinthe.Schema.Notation

  object :group do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, :string

    field :icon, non_null(:string) do
      resolve fn group, _, _ ->
        group.icon || "IconPlanet"
      end
    end
    
    field :color, non_null(:string) do
      resolve fn group, _, _ ->
        group.color || "text-green-500"
      end
    end

    field :members, list_of(non_null(:person)) do
      resolve fn group, _, _ ->
        people = Operately.Groups.list_members(group)

        {:ok, people}
      end
    end

    field :points_of_contact, list_of(non_null(:group_contact)) do
      resolve fn group, _, _ ->
        contacts = Operately.Groups.list_contacts(group)

        {:ok, contacts}
      end
    end
  end
end
