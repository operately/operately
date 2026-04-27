defmodule OperatelyWeb.Api.CliAuth do
  defmodule AuthPassword do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    require Logger

    alias Operately.People.{Account, CliAuthSession}

    inputs do
      field :email, :string
      field :password, :string
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :bootstrap_token, :string, null: true
      field? :message, :string, null: true
    end

    def call(_conn, inputs) do
      with {:ok, :allowed} <- check_login_allowed(),
           {:ok, account} <- authenticate_account(inputs) do
        respond_with_authenticated_account(account)
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, :unauthorized} ->
          Logger.info("CLI password authentication failed for #{inputs.email}")
          {:error, :unauthorized, "Invalid email or password"}
      end
    end

    defp check_login_allowed do
      if Application.get_env(:operately, :allow_login_with_email) do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end

    defp authenticate_account(inputs) do
      case Operately.People.get_account_by_email_and_password(inputs.email, inputs.password) do
        %Account{} = account -> {:ok, account}
        _ -> {:error, :unauthorized}
      end
    end

    defp respond_with_authenticated_account(account) do
      companies = CliAuthSession.eligible_companies(account)

      case companies do
        [] -> no_companies_response()
        companies -> create_authenticated_response(account, companies)
      end
    end

    defp no_companies_response do
      {:ok,
       %{
         status: :no_companies,
         companies: [],
         message: CliAuthSession.no_companies_message()
       }}
    end

    defp create_authenticated_response(account, companies) do
      case CliAuthSession.create_authenticated_session(account) do
        {:ok, _session, raw_token} ->
          {:ok,
           %{
             status: :authenticated,
             companies: Serializer.serialize(companies, level: :essential),
             bootstrap_token: raw_token
           }}

        {:error, _changeset} ->
          {:error, :internal_server_error}
      end
    end
  end

  defmodule StartGoogle do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.CliAuthSession
    alias OperatelyWeb.Paths

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field :bootstrap_token, :string, null: false
      field :login_url, :string, null: false
      field :poll_interval_ms, :integer, null: false
    end

    def call(_conn, _inputs) do
      with {:ok, :allowed} <- check_login_allowed(),
           {:ok, session, raw_token} <- CliAuthSession.create_pending_google_session() do
        {:ok,
         %{
           status: :pending,
           companies: [],
           bootstrap_token: raw_token,
           login_url: Paths.cli_login_path(session.id) |> Paths.to_url(),
           poll_interval_ms: CliAuthSession.poll_interval_ms()
         }}
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, _changeset} ->
          {:error, :internal_server_error}
      end
    end

    defp check_login_allowed do
      if Application.get_env(:operately, :allow_login_with_google) do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end
  end

  defmodule Status do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    alias Operately.People.CliAuthSession

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :message, :string, null: true
    end

    def call(conn, _inputs) do
      session = conn.assigns[:current_cli_auth_session]
      account = conn.assigns[:current_account]

      with :ok <- validate_status_session(session) do
        cond do
          CliAuthSession.expired?(session) ->
            {:ok,
             %{
               status: :expired,
               companies: [],
               message: CliAuthSession.expired_message()
             }}

          session.status == :pending ->
            {:ok,
             %{
               status: :pending,
               companies: []
             }}

          CliAuthSession.no_companies?(session) ->
            {:ok,
             %{
               status: :no_companies,
               companies: [],
               message: CliAuthSession.no_companies_message()
             }}

          account ->
            companies = CliAuthSession.eligible_companies(account)

            if companies == [] do
              {:ok,
               %{
                 status: :no_companies,
                 companies: [],
                 message: CliAuthSession.no_companies_message()
               }}
            else
              {:ok,
               %{
                 status: :authenticated,
                 companies: Serializer.serialize(companies, level: :essential)
               }}
            end

          true ->
            {:error, :unauthorized}
        end
      else
        {:error, :unauthorized} ->
          {:error, :unauthorized}
      end
    end

    defp validate_status_session(session) do
      cond do
        CliAuthSession.consumed?(session) ->
          {:error, :unauthorized}

        session.status == :failed and not CliAuthSession.no_companies?(session) ->
          {:error, :unauthorized}

        true ->
          :ok
      end
    end
  end

  defmodule CreateToken do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Operations.CliApiTokenCreating
    alias Operately.People.CliAuthSession

    inputs do
      field :company_id, :company_id
      field? :read_only, :boolean, null: false
    end

    outputs do
      field :company, :company, null: false
      field :api_token, :api_token, null: false
      field :token, :string, null: false
    end

    def call(conn, inputs) do
      session = conn.assigns[:current_cli_auth_session]
      account = conn.assigns[:current_account]
      read_only = if is_nil(inputs[:read_only]), do: true, else: inputs[:read_only]

      with :ok <- validate_token_creation_session(session),
           %{} <- account do
        case CliApiTokenCreating.run(session, account, inputs.company_id, read_only) do
          {:ok, company, api_token, raw_token} ->
            {:ok,
             %{
               company: Serializer.serialize(company, level: :essential),
               api_token: Serializer.serialize(api_token, level: :essential),
               token: raw_token
             }}

          {:error, :forbidden} ->
            {:error, :forbidden}

          {:error, :not_found} ->
            {:error, :not_found}

          {:error, :unauthorized} ->
            {:error, :unauthorized}

          {:error, _changeset} ->
            {:error, :internal_server_error}
        end
      else
        {:error, :unauthorized} ->
          {:error, :unauthorized}

        nil ->
          {:error, :unauthorized}
      end
    end

    defp validate_token_creation_session(session) do
      cond do
        CliAuthSession.consumed?(session) ->
          {:error, :unauthorized}

        CliAuthSession.expired?(session) ->
          {:error, :unauthorized}

        session.status != :authenticated ->
          {:error, :unauthorized}

        true ->
          :ok
      end
    end
  end
end
