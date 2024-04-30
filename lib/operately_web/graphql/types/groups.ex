defmodule OperatelyWeb.Graphql.Types.Groups do
  use Absinthe.Schema.Notation

  object :group do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, :string

    field :is_member, non_null(:boolean) do
      resolve fn group, _, %{context: context} ->
        person = context.current_account.person

        {:ok, Operately.Groups.is_member?(group, person)}
      end
    end

    field :is_company_space, non_null(:boolean) do
      resolve fn group, _, _ ->
        company = Operately.Companies.get_company!(group.company_id)

        {:ok, company.company_space_id == group.id}
      end
    end

    field :private_space, non_null(:boolean) do
      resolve fn _, _, _ ->
        {:ok, false}
      end
    end

    field :icon, non_null(:string) do
      resolve fn group, _, _ ->
        {:ok, group.icon || "IconPlanet"}
      end
    end
    
    field :color, non_null(:string) do
      resolve fn group, _, _ ->
        {:ok, group.color || "text-green-500"}
      end
    end

    field :members, list_of(non_null(:person)) do
      resolve fn group, _, _ ->
        IO.inspect("Group members")
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
