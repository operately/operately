defmodule OperatelyWeb.Api.Invitations do
  alias Operately.Repo
  alias Operately.InviteLinks

  defmodule GetInviteLinkByToken do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field(:token, :string)
    end

    outputs do
      field?(:invite_link, :invite_link, null: true)
    end

    def call(_conn, inputs) do
      case InviteLinks.get_invite_link_by_token(inputs[:token]) do
        {:ok, link} -> {:ok, %{invite_link: Serializer.serialize(link, level: :full)}}
        {:error, :not_found} -> {:ok, %{invite_link: nil}}
      end
    end
  end

  defmodule CreateInviteLink do
    use TurboConnect.Mutation

    alias OperatelyWeb.Api.Serializer
    alias Operately.Companies.Company
    alias Operately.Companies.Permissions

    require Logger

    inputs do
      field?(:allowed_domains, list_of(:string), null: true)
    end

    outputs do
      field(:invite_link, :invite_link)
    end

    def call(conn, inputs) do
      conn
      |> start_transaction()
      |> load_company(conn)
      |> check_permissions()
      |> create_invite_link(inputs)
      |> commit()
      |> respond()
    end

    def start_transaction(conn) do
      Ecto.Multi.new() |> Ecto.Multi.put(:me, conn.assigns.current_person)
    end

    def load_company(multi, conn) do
      Ecto.Multi.run(multi, :company, fn _, %{me: me} ->
        Company.get(me, id: conn.assigns.current_company.id)
      end)
    end

    def check_permissions(multi) do
      Ecto.Multi.run(multi, :check_permissions, fn _, %{company: company} ->
        Permissions.check(company.request_info.access_level, :can_invite_members)
      end)
    end

    defp create_invite_link(multi, inputs) do
      Ecto.Multi.run(multi, :invite_link, fn _, %{me: me, company: company} ->
        InviteLinks.create_invite_link(%{
          company_id: company.id,
          author_id: me.id,
          allowed_domains: inputs[:allowed_domains] || []
        })
      end)
    end

    defp commit(multi), do: Repo.transaction(multi)

    def respond(result) do
      case result do
        {:ok, ctx} ->
          invite_link = Repo.preload(ctx.invite_link, [:author, :company])
          {:ok, %{invite_link: Serializer.serialize(invite_link, level: :full)}}

        {:error, :check_permissions, :forbidden, _} ->
          {:error, :forbidden}

        e ->
          Logger.error("Failed to create invite link: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end

  defmodule JoinCompanyViaInviteLink do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field(:token, :string)
    end

    outputs do
      field?(:company, :company, null: true)
    end

    def call(conn, inputs) do
      with(
        {:ok, account} <- find_account(conn),
        {:ok, person} <- InviteLinks.join_company_via_invite_link(account, inputs.token)
      ) do
        company = Repo.preload(person, :company).company
        response = %{company: Serializer.serialize(company, level: :essential)}

        {:ok, response}
      else
        {:error, :not_found} ->
          {:error, :unauthorized, "Account not found"}

        {:error, :invite_token_not_found} ->
          {:error, :bad_request, "Invalid invite link"}

        {:error, :invite_token_inactive} ->
          {:error, :bad_request, "This invite link is no longer valid"}

        {:error, :invite_token_expired} ->
          {:error, :bad_request, "This invite link has expired"}

        {:error, :invite_token_domain_not_allowed} ->
          {:error, :bad_request, "This invite link is restricted to specific email domains"}

        {:error, :invite_token_invalid} ->
          {:error, :bad_request, "This invite link is no longer valid"}

        {:error, :person_creation_failed} ->
          {:error, :bad_request, "Unable to add you to this company."}

        {:error, :invite_link_update_failed} ->
          {:error, :bad_request, "Something went wrong while using this invite link."}
      end
    end
  end

  defmodule RevokeInviteLink do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Companies
    alias Operately.Companies.Permissions

    inputs do
      field?(:invite_link_id, :string, null: false)
    end

    outputs do
      field?(:invite_link, :invite_link, null: false)
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:invite_link_id, fn -> decode_id(inputs[:invite_link_id]) end)
      |> run(:invite_link, fn ctx ->
        {:ok, Operately.InviteLinks.get_invite_link!(ctx.invite_link_id)}
      end)
      |> run(:company, fn ctx ->
        Companies.get_company_with_access_level(ctx.me.id, id: ctx.invite_link.company_id)
      end)
      |> run(:check_permissions, fn ctx ->
        Permissions.check(ctx.company.requester_access_level, :can_invite_members)
      end)
      |> run(:revoked_link, fn ctx ->
        with {:ok, invite_link} <- Operately.InviteLinks.revoke_invite_link(ctx.invite_link) do
          {:ok, Repo.preload(invite_link, [:author, :company])}
        end
      end)
      |> run(:serialized, fn ctx ->
        {:ok, %{invite_link: Serializer.serialize(ctx.revoked_link, level: :full)}}
      end)
      |> respond()
    end

    def respond(result) do
      case result do
        {:ok, ctx} ->
          {:ok, ctx.serialized}

        {:error, :invite_link_id, _} ->
          {:error, :bad_request, %{message: "Missing required fields: invite_link_id"}}

        {:error, :invite_link, _} ->
          {:error, :not_found}

        {:error, :company, _} ->
          {:error, :not_found}

        {:error, :check_permissions, _} ->
          {:error, :forbidden}

        {:error, :revoked_link, changeset} ->
          {:error, :bad_request, extract_error_message(changeset)}

        _ ->
          {:error, :internal_server_error}
      end
    end

    defp extract_error_message(changeset) do
      changeset.errors
      |> Enum.map(fn {field, {message, _}} -> "#{field} #{message}" end)
      |> Enum.join(", ")
    end
  end
end
