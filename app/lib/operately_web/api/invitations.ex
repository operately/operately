defmodule OperatelyWeb.Api.Invitations do
  defmodule GetInviteLink do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field?(:token, :string, null: false)
    end

    outputs do
      field?(:invite_link, :invite_link, null: true)
    end

    def call(_conn, inputs) do
      invite_link = Operately.InviteLinks.get_invite_link_by_token(inputs[:token])

      case invite_link do
        nil -> {:ok, %{invite_link: nil}}
        link -> {:ok, %{invite_link: Serializer.serialize(link, level: :full)}}
      end
    end
  end

  defmodule ListInviteLinks do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    alias Operately.Companies
    alias Operately.Companies.Permissions

    inputs do
      field?(:company_id, :string, null: false)
    end

    outputs do
      field?(:invite_links, list_of(:invite_link), null: false)
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:company_id, fn -> decode_id(inputs[:company_id]) end)
      |> run(:company, fn ctx ->
        Companies.get_company_with_access_level(ctx.me.id, id: ctx.company_id)
      end)
      |> run(:check_permissions, fn ctx ->
        Permissions.check(ctx.company.requester_access_level, :can_invite_members)
      end)
      |> run(:invite_links, fn ctx ->
        {:ok, Operately.InviteLinks.list_invite_links_for_company(ctx.company_id)}
      end)
      |> run(:serialized, fn ctx ->
        {:ok, %{invite_links: Serializer.serialize(ctx.invite_links, level: :essential)}}
      end)
      |> respond()
    end

    def respond(result) do
      case result do
        {:ok, ctx} ->
          {:ok, ctx.serialized}

        {:error, :company_id, _} ->
          {:error, :bad_request, %{message: "Missing required fields: company_id"}}

        {:error, :company, _} ->
          {:error, :not_found}

        {:error, :check_permissions, _} ->
          {:error, :forbidden}

        _ ->
          {:error, :internal_server_error}
      end
    end
  end

  defmodule CreateInviteLink do
    use TurboConnect.Mutation

    alias Operately.Companies.Company
    alias Operately.Companies.Permissions

    inputs do
    end

    outputs do
      field :invite_link, :invite_link
    end

    def call(conn, _inputs) do
      conn
      |> start_transaction()
      |> load_company(conn)
      |> check_permissions()
      |> create_invite_link()
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

    defp create_invite_link(multi) do
      Ecto.Multi.run(multi, :invite_link, fn _, %{me: me, company: company} ->
        Operately.InviteLinks.create_invite_link(%{
          company_id: company.id,
          author_id: me.id
        })
      end)
    end

    defp commit(multi) do
      Operately.Repo.commit(multi)
    end

    def respond(result) do
      case result do
        {:ok, ctx} ->
          {:ok, ctx.serialized}

        {:error, :company_id, _} ->
          {:error, :bad_request, %{message: "Missing required fields: company_id"}}

        {:error, :company, _} ->
          {:error, :not_found}

        {:error, :check_permissions, _} ->
          {:error, :forbidden}

        {:error, :invite_link, changeset} ->
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

  defmodule JoinCompanyViaInviteLink do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field?(:token, :string, null: false)
      field?(:password, :string, null: true)
      field?(:password_confirmation, :string, null: true)
    end

    outputs do
      field?(:company, :company, null: true)
      field?(:person, :person, null: true)
      field?(:error, :string, null: true)
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:invite_link, fn -> get_invite_link(inputs[:token]) end)
      |> run(:validate_link, fn ctx -> validate_invite_link(ctx.invite_link) end)
      |> run(:me, fn -> find_me_if_logged_in(conn) end)
      |> run(:handle_join, fn ctx -> handle_join(ctx, inputs) end)
      |> run(:serialized, fn ctx -> serialize_result(ctx) end)
      |> respond()
    end

    def respond(result) do
      case result do
        {:ok, ctx} ->
          {:ok, ctx.serialized}

        {:error, :invite_link, _} ->
          {:ok, %{company: nil, person: nil, error: "Invalid invite link"}}

        {:error, :validate_link, %{error: error}} ->
          {:ok, %{company: nil, person: nil, error: normalize_error(error)}}

        {:error, :handle_join, %{error: error}} ->
          {:ok, %{company: nil, person: nil, error: normalize_error(error)}}

        _ ->
          {:error, :internal_server_error}
      end
    end

    defp get_invite_link(token) do
      case Operately.InviteLinks.get_invite_link_by_token(token) do
        nil -> {:error, :not_found}
        link -> {:ok, link}
      end
    end

    defp validate_invite_link(invite_link) do
      cond do
        not invite_link.is_active ->
          {:error, "This invite link is no longer valid"}

        Operately.InviteLinks.InviteLink.is_expired?(invite_link) ->
          {:error, "This invite link has expired"}

        true ->
          {:ok, invite_link}
      end
    end

    defp find_me_if_logged_in(conn) do
      try do
        case find_me(conn) do
          {:ok, person} -> {:ok, person}
          {:error, _} -> {:ok, nil}
        end
      rescue
        _ -> {:ok, nil}
      end
    end

    defp handle_join(%{me: nil, invite_link: invite_link}, inputs) do
      # New user signup flow
      if inputs[:password] && inputs[:password_confirmation] do
        handle_new_user_signup(invite_link, inputs)
      else
        {:error, "Password required for new users"}
      end
    end

    defp handle_join(%{me: person, invite_link: invite_link}, _inputs) do
      # Existing logged-in user
      handle_existing_user_join(person, invite_link)
    end

    defp handle_new_user_signup(_invite_link, inputs) do
      if inputs[:password] != inputs[:password_confirmation] do
        {:error, "Passwords don't match"}
      else
        # For new users, we'll handle this in the frontend
        # by redirecting to sign up with the token preserved
        {:error, "Please sign up first and then use this invite link"}
      end
    end

    defp handle_existing_user_join(person, invite_link) do
      cond do
        person.company_id == invite_link.company_id ->
          # Already a member, redirect to company
          company = invite_link.company
          {:ok, %{company: company, person: person, action: :redirect}}

        true ->
          # For now, return an error for simplicity
          # In a full implementation, this would involve complex company switching logic
          {:error, "Company joining for existing users not yet implemented. Please contact support."}
      end
    end

    defp serialize_result(%{handle_join: result}) do
      case result do
        %{company: company, person: person, action: _action} ->
          {:ok,
           %{
             company: Serializer.serialize(company, level: :essential),
             person: Serializer.serialize(person, level: :essential),
             error: nil
           }}

        {:error, message} ->
          {:ok, %{company: nil, person: nil, error: normalize_error(message)}}

        message ->
          {:ok, %{company: nil, person: nil, error: normalize_error(message)}}
      end
    end

    defp normalize_error({:error, message}) when is_binary(message), do: message
    defp normalize_error(message) when is_binary(message), do: message
    defp normalize_error(_), do: "An unexpected error occurred"
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
