defmodule OperatelyWeb.Api.Mutations.AddCompanyTrustedEmailDomain do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field :company_id, :string
    field :domain, :string
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_company_id(inputs.company_id) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, short_id: ctx.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_edit_trusted_email_domains) end)
    |> run(:operation, fn ctx -> Companies.add_trusted_email_domain(ctx.company, inputs.domain) end)
    |> run(:serialized, fn ctx -> {:ok, %{company: Serializer.serialize(ctx.company)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
