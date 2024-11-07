defmodule Operately.Demo.Spaces do
  alias Operately.Demo.Resources

  def create_spaces(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_space(resources, data)
    end)
  end

  def create_space(resources, data) do
    owner = Resources.get(resources, :owner)

    {:ok, group} = Operately.Groups.create_group(owner, %{
      name: data.name,
      mission: data.description,
      company_permissions: 70,
      public_permissions: 0
    })

    group
  end
end
