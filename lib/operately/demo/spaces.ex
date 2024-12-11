defmodule Operately.Demo.Spaces do
  alias Operately.Demo.Resources

  def create_spaces(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_space(resources, data)
    end)
  end

  def create_space(resources, data) do
    owner = Resources.get(resources, :owner)

    {:ok, space} = Operately.Groups.create_group(owner, %{
      name: data.name,
      mission: data.description,
      company_permissions: company_permissions(data[:privacy] || :company_wide),
      public_permissions: 0
    })

    {:ok, _} = add_members(resources, owner, space, data)

    space
  end

  defp company_permissions(:company_wide), do: 70
  defp company_permissions(:invite_only), do: 0

  defp add_members(resources, owner, space, data) do
    members = Resources.get(resources, data[:members] || [])

    members = Enum.map(members, fn member ->
      %{id: member.id, access_level: Operately.Access.Binding.edit_access()}
    end)

    Operately.Groups.add_members(owner, space.id, members)
  end
end
