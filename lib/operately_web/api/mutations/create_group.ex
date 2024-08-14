defmodule OperatelyWeb.Api.Mutations.CreateGroup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2]

  inputs do
    field :name, :string
    field :mission, :string
    field :icon, :string
    field :color, :string

    field :company_permissions, :integer
    field :public_permissions, :integer
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    author = me(conn)

    if has_permissions?(author) do
      {:ok, group} = Operately.Groups.create_group(author, inputs)
      {:ok, %{group: Serializer.serialize(group, level: :essential)}}
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person) do
    from(c in Operately.Companies.Company, where: c.id == ^person.company_id)
    |> filter_by_full_access(person.id)
    |> Repo.exists?()
  end
end
