defmodule OperatelyWeb.Api.Mutations.NewInvitationToken do
  use Gettext, backend: OperatelyWeb.Gettext
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
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_invite_members, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> execute(ctx.me, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{invite_link: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :not_found}} -> {:error, :not_found, gettext("Team member not found.")}
      {:error, :operation, %{error: [message: message]}} -> {:error, :bad_request, message}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp execute(admin, inputs) do
    {:ok, id} = decode_id(inputs.person_id)

    person = Repo.get_by(Operately.People.Person, id: id, company_id: admin.company_id) |> Repo.preload(:account)

    cond do
      is_nil(person) ->
        {:error, :not_found}

      not open_invitation?(person) ->
        {:error, message: gettext("Team member doesn't have an open invitation.")}

      true ->
        create_token(admin, person)
    end
  end

  defp create_token(admin, person) do
    case Operately.InviteLinks.get_personal_invite_link_for_person(person.id) do
      {:ok, link} when link.company_id == admin.company_id ->
        Operately.InviteLinks.refresh_personal_invite_link(link)

      {:ok, _foreign_link} ->
        {:error, :not_found}

      {:error, :not_found} ->
        Operately.InviteLinks.create_personal_invite_link(%{
          company_id: admin.company_id,
          author_id: admin.id,
          person_id: person.id
        })
    end
  end

  defp open_invitation?(%{account: %{first_login_at: nil}}), do: true
  defp open_invitation?(_person), do: false
end
