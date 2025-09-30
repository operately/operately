defmodule OperatelyWeb.Api.Queries.ListInviteLinks do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field? :company_id, :string, null: false
  end

  outputs do
    field? :invite_links, list_of(:invite_link), null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company_id, fn -> decode_id(inputs.company_id) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_view_company) end)
    |> run(:invite_links, fn ctx -> {:ok, Operately.InviteLinks.list_invite_links_for_company(ctx.company_id)} end)
    |> run(:serialized, fn ctx -> {:ok, %{invite_links: Serializer.serialize(ctx.invite_links, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end