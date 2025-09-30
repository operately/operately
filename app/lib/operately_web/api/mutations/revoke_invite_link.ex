defmodule OperatelyWeb.Api.Mutations.RevokeInviteLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field? :invite_link_id, :string, null: false
  end

  outputs do
    field? :invite_link, :invite_link, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:invite_link_id, fn -> decode_id(inputs.invite_link_id) end)
    |> run(:invite_link, fn ctx -> {:ok, Operately.InviteLinks.get_invite_link!(ctx.invite_link_id)} end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.invite_link.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_invite_members) end)
    |> run(:revoked_link, fn ctx -> Operately.InviteLinks.revoke_invite_link(ctx.invite_link) end)
    |> run(:serialized, fn ctx -> {:ok, %{invite_link: Serializer.serialize(ctx.revoked_link, level: :full)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :invite_link, _} -> {:error, :not_found}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :revoked_link, changeset} -> {:error, :bad_request, extract_error_message(changeset)}
      _ -> {:error, :internal_server_error}
    end
  end

  defp extract_error_message(changeset) do
    changeset.errors
    |> Enum.map(fn {field, {message, _}} -> "#{field} #{message}" end)
    |> Enum.join(", ")
  end
end