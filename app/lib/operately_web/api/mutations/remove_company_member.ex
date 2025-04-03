defmodule OperatelyWeb.Api.Mutations.RemoveCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyMemberRemoving

  inputs do
    field :person_id, :string
  end

  outputs do
    field :person, :person
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:member_id, fn -> decode_id(inputs.person_id) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_remove_members) end)
    |> run(:operation, fn ctx -> CompanyMemberRemoving.run(ctx.me, ctx.member_id) end)
    |> run(:serialized, fn ctx -> {:ok, %{person: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
