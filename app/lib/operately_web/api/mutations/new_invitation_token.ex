defmodule OperatelyWeb.Api.Mutations.NewInvitationToken do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions

  inputs do
    field :person_id, :string, null: false
  end

  outputs do
    field :invite_link, :invite_link, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_invite_members) end)
    |> run(:operation, fn -> execute(inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{invite_link: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: [message: message]}} -> {:error, :bad_request, message}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp execute(inputs) do
    {:ok, id} = decode_id(inputs.person_id)

    person = Operately.People.get_person(id)

    cond do
      is_nil(person) ->
        {:error, message: "Team member not found."}

      not person.has_open_invitation ->
        {:error, message: "Team member doesn't have an open invitation."}

      true ->
        create_token(person)
    end
  end

  defp create_token(person) do
    invite_link =
      case Operately.InviteLinks.get_personal_invite_link_for_person(person.id) do
        {:ok, link} -> link
        {:error, :not_found} -> {:error, message: "Team member doesn't have an open invitation."}
      end

    case invite_link do
      {:error, _} = error ->
        error

      %Operately.InviteLinks.InviteLink{} = link ->
        {:ok, _link} = Operately.InviteLinks.refresh_personal_invite_link(link)
    end
  end
end
