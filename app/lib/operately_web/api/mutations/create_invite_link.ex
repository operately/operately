defmodule OperatelyWeb.Api.Mutations.CreateInviteLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field? :company_id, :string, null: false
  end

  outputs do
    field? :invite_link, :invite_link, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company_id, fn -> decode_id(inputs.company_id) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_invite_members) end)
    |> run(:invite_link, fn ctx -> create_invite_link(ctx) end)
    |> run(:serialized, fn ctx -> {:ok, %{invite_link: Serializer.serialize(ctx.invite_link, level: :full)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :invite_link, changeset} -> {:error, :bad_request, extract_error_message(changeset)}
      _ -> {:error, :internal_server_error}
    end
  end

  defp create_invite_link(ctx) do
    Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company_id,
      author_id: ctx.me.id
    })
  end

  defp extract_error_message(changeset) do
    changeset.errors
    |> Enum.map(fn {field, {message, _}} -> "#{field} #{message}" end)
    |> Enum.join(", ")
  end
end