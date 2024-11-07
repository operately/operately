defmodule OperatelyWeb.Api.Mutations.CreateSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions

  inputs do
    field :name, :string
    field :mission, :string

    field :company_permissions, :integer
    field :public_permissions, :integer
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn ctx -> Company.get(ctx.me, id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.request_info.access_level, :can_create_space) end)
    |> run(:space, fn ctx -> Operately.Groups.create_group(ctx.me, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{group: Serializer.serialize(ctx.space, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
