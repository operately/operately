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

  defmodule GetCompanyInviteLink do
    use TurboConnect.Mutation

    alias OperatelyWeb.Api.Serializer
    alias Operately.Companies.Company
    alias Operately.Companies.Permissions

    require Logger

    outputs do
      field(:invite_link, :invite_link)
    end

    def call(conn, _inputs) do
      conn
      |> start_transaction()
      |> load_company(conn)
      |> check_permissions()
      |> fetch_or_create_invite_link()
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

    defp fetch_or_create_invite_link(multi) do
      Ecto.Multi.run(multi, :invite_link, fn _, %{me: me, company: company} ->
        InviteLinks.fetch_or_create_invite_link(%{
          company_id: company.id,
          author_id: me.id,
          allowed_domains: []
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
          {:error, :not_found}

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

  defmodule UpdateCompanyInviteLink do
    require Logger

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Companies.{Company, Permissions}

    inputs do
      field?(:is_active, :boolean)
      field?(:allowed_domains, list_of(:string))
    end

    outputs do
      field?(:invite_link, :invite_link, null: false)
    end

    def call(conn, inputs) do
      conn
      |> start_transaction()
      |> load_company(conn)
      |> check_permissions()
      |> find_link()
      |> update_link(inputs)
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

    def find_link(multi) do
      Ecto.Multi.run(multi, :invite_link, fn _, %{company: company} ->
        InviteLinks.get_invite_link(company.id)
      end)
    end

    def update_link(multi, inputs) do
      Ecto.Multi.run(multi, :updated_invite_link, fn _, %{invite_link: invite_link} ->
        InviteLinks.update_invite_link(invite_link, inputs)
      end)
    end

    defp commit(multi), do: Repo.transaction(multi)

    def respond(result) do
      case result do
        {:ok, %{updated_invite_link: link}} ->
          {:ok, Serializer.serialize(link, level: :essential)}

        _ ->
          Logger.error("Failed to update invite link: #{inspect(result)}")
          {:error, :internal_server_error}
      end
    end
  end

  defmodule ResetCompanyInviteLink do
    require Logger

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Companies.{Company, Permissions}

    outputs do
      field :invite_link, :invite_link
    end

    def call(conn, _inputs) do
      conn
      |> start_transaction()
      |> load_company(conn)
      |> check_permissions()
      |> find_link()
      |> reset_token()
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

    def find_link(multi) do
      Ecto.Multi.run(multi, :invite_link, fn _, %{company: company} ->
        InviteLinks.get_invite_link(company.id)
      end)
    end

    def reset_token(multi) do
      Ecto.Multi.run(multi, :reset_invite_link, fn _, %{invite_link: invite_link} ->
        InviteLinks.reset_invite_link_token(invite_link)
      end)
    end

    defp commit(multi), do: Repo.transaction(multi)

    def respond(result) do
      case result do
        {:ok, %{reset_invite_link: link}} ->
          link = Repo.preload(link, [:author, :company])
          {:ok, %{invite_link: Serializer.serialize(link, level: :full)}}

        {:error, :check_permissions, :forbidden, _} ->
          {:error, :forbidden}

        {:error, :invite_link, :not_found, _} ->
          {:error, :not_found}

        e ->
          Logger.error("Failed to reset invite link: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
