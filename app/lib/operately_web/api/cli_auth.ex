defmodule OperatelyWeb.Api.CliAuth do
  alias OperatelyWeb.Api.CliAuth.SharedSteps, as: Steps
  defmodule AuthPassword do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    require Logger

    alias Operately.People.Account

    inputs do
      field :email, :string
      field :password, :string
      field? :invite_token, :string, null: true
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :bootstrap_token, :string, null: true
      field? :message, :string, null: true
    end

    def call(_conn, inputs) do
      with {:ok, :allowed} <- Steps.check_email_login_allowed(),
           {:ok, account} <- authenticate_account(inputs),
           {:ok, account} <- Steps.maybe_join_via_invite(account, inputs[:invite_token]) do
        Steps.respond_with_authenticated_account(account, :password)
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, :unauthorized} ->
          Logger.info("CLI password authentication failed for #{inputs.email}")
          {:error, :unauthorized, "Invalid email or password"}

        {:error, {message, details}} ->
          {:error, :bad_request, message, details}

        {:error, reason} when is_binary(reason) ->
          {:error, :bad_request, reason}
      end
    end

    defp authenticate_account(inputs) do
      case Operately.People.get_account_by_email_and_password(inputs.email, inputs.password) do
        %Account{} = account -> {:ok, account}
        _ -> {:error, :unauthorized}
      end
    end
  end

  defmodule RequestEmailCode do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.EmailActivationCode

    inputs do
      field :email, :string
    end

    def call(_conn, inputs) do
      with {:ok, :allowed} <- Steps.check_email_login_allowed(),
           {:ok, _account} <- Steps.fetch_account(inputs.email),
           {:ok, _activation} <- EmailActivationCode.create(inputs.email) do
        {:ok, %{}}
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, :account_not_found} ->
          {:error, :bad_request, Steps.account_not_found_message()}

        {:error, :email_delivery_not_configured} ->
          {:error, :bad_request, Steps.email_delivery_not_configured_message()}

        {:error, reason} when is_binary(reason) ->
          {:error, :bad_request, reason}

        {:error, _reason} ->
          {:error, :internal_server_error}
      end
    end
  end

  defmodule AuthEmailCode do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Operations.EmailActivationCodeConsuming
    alias Operately.People.EmailActivationCode

    inputs do
      field :email, :string
      field :code, :string
      field? :invite_token, :string, null: true
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :bootstrap_token, :string, null: true
      field? :message, :string, null: true
    end

    def call(_conn, inputs) do
      with {:ok, :allowed} <- Steps.check_email_login_allowed(),
           {:ok, account} <- Steps.fetch_account(inputs.email),
           {:ok, _account} <- Steps.validate_email_code_request(account, inputs[:invite_token]),
           {:ok, _activation} <- EmailActivationCodeConsuming.run(inputs.email, inputs.code),
           {:ok, account} <- Steps.maybe_join_via_invite(account, inputs[:invite_token]) do
        Steps.respond_with_authenticated_account(account, :email_code)
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, :account_not_found} ->
          {:error, :bad_request, Steps.account_not_found_message()}

        {:error, :not_found} ->
          {:error, :bad_request, "Invalid activation code"}

        {:error, :invalid_code} ->
          {:error, :bad_request, "Invalid activation code"}

        {:error, :invalid} ->
          {:error, :bad_request, "Activation code has expired"}

        {:error, {message, details}} ->
          {:error, :bad_request, message, details}

        {:error, reason} when is_binary(reason) ->
          {:error, :bad_request, reason}

        {:error, _reason} ->
          {:error, :internal_server_error}
      end
    end
  end

  defmodule StartGoogle do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.CliAuthSession
    alias OperatelyWeb.Paths

    inputs do
      field? :invite_token, :string, null: true
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field :bootstrap_token, :string, null: false
      field :login_url, :string, null: false
      field :poll_interval_ms, :integer, null: false
    end

    def call(_conn, inputs) do
      with {:ok, :allowed} <- check_login_allowed(),
           {:ok, session, raw_token} <- CliAuthSession.create_pending_google_session() do
        {:ok,
         %{
           status: :pending,
           companies: [],
           bootstrap_token: raw_token,
           login_url: build_login_url(session.id, inputs[:invite_token]),
           poll_interval_ms: CliAuthSession.poll_interval_ms()
         }}
      else
        {:error, :forbidden} ->
          {:error, :forbidden}

        {:error, _changeset} ->
          {:error, :internal_server_error}
      end
    end

    defp build_login_url(session_id, nil) do
      Paths.cli_login_path(session_id) |> Paths.to_url()
    end

    defp build_login_url(session_id, invite_token) do
      path = Paths.cli_login_path(session_id)
      "#{Paths.to_url(path)}?invite_token=#{URI.encode_www_form(invite_token)}"
    end

    defp check_login_allowed do
      if Application.get_env(:operately, :allow_login_with_google) do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end
  end

  defmodule StartGoogleSignup do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.CliAuthSession
    alias OperatelyWeb.Paths

    inputs do
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field :bootstrap_token, :string, null: false
      field :login_url, :string, null: false
      field :poll_interval_ms, :integer, null: false
    end

    def call(_conn, _inputs) do
      with {:ok, :allowed} <- check_signup_allowed(),
           {:ok, session, raw_token} <- CliAuthSession.create_pending_google_session(:signup) do
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

    defp check_signup_allowed do
      if Application.get_env(:operately, :allow_login_with_google) do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end
  end

  defmodule JoinCompany do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.{Account, CliAuthSession}

    require Logger

    inputs do
      field :token, :string, null: false
      field :password, :string, null: false
      field :password_confirmation, :string, null: false
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :bootstrap_token, :string, null: true
      field? :message, :string, null: true
    end

    def call(_conn, inputs) do
      with {:ok, invite_link} <- validate(inputs),
           {:ok, %{member_account: account}} <- Operately.Operations.PasswordFirstTimeChanging.run(inputs, invite_link) do
        companies = CliAuthSession.eligible_companies(account)

        case create_authenticated_response(account, companies) do
          {:ok, response} -> {:ok, response}
          {:error, _changeset} -> {:error, :internal_server_error}
        end
      else
        {:error, reason} when is_binary(reason) ->
          {:error, :bad_request, reason}

        {:error, :member_account, changeset, _changes} ->
          {:error, :bad_request, format_changeset_error(changeset)}

        {:error, _step, _error, _changes} ->
          {:error, :internal_server_error}
      end
    end

    defp validate(inputs) do
      cond do
        inputs.password != inputs.password_confirmation ->
          {:error, "Passwords don't match"}

        true ->
          with(
            {:ok, invite_link} <- Operately.InviteLinks.get_personal_invite_link_by_token(inputs.token, preload: [person: [:account]]),
            {:ok, _invite_link} <- Operately.InviteLinks.validate_personal_invite_link(invite_link),
            true <- not is_nil(invite_link.person)
          ) do
            {:ok, invite_link}
          else
            _ -> {:error, "Invalid token"}
          end
      end
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

        {:error, changeset} ->
          {:error, changeset}
      end
    end

    defp format_changeset_error(changeset) do
      changeset
      |> Ecto.Changeset.traverse_errors(fn {message, opts} ->
        Regex.replace(~r"%{(\w+)}", message, fn _, key ->
          opts
          |> Keyword.get(String.to_existing_atom(key), key)
          |> to_string()
        end)
      end)
      |> Enum.flat_map(fn {_field, messages} -> messages end)
      |> Enum.at(0, "The request was malformed")
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

          session.status == :failed ->
            {:ok,
             %{
               status: :failed,
               companies: [],
               message: CliAuthSession.failure_message(session)
             }}

          account ->
            companies = CliAuthSession.eligible_companies(account)

            if companies == [] and not CliAuthSession.signup?(session) do
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

      with :ok <- Steps.validate_token_creation_session(session),
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
  end

  defmodule CheckAccount do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.People.Account

    inputs do
      field :email, :string
    end

    outputs do
      field :exists, :boolean
      field? :has_password, :boolean, null: true
    end

    def call(_conn, inputs) do
      {exists, has_password} = check_account(inputs.email)

      {:ok, %{exists: exists, has_password: if(exists, do: has_password, else: nil)}}
    end

    defp check_account(email) do
      case Operately.People.get_account_by_email(email) do
        nil -> {false, false}
        %Account{} = account -> {true, not is_nil(account.hashed_password)}
      end
    end
  end

  defmodule Signup do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Operations.AccountSigningUp
    alias Operately.People.CliAuthSession

    require Logger

    inputs do
      field :email, :string
      field :code, :string
      field :full_name, :string
      field :password, :string
    end

    outputs do
      field :status, :cli_auth_status
      field :companies, list_of(:company)
      field? :bootstrap_token, :string, null: true
      field? :message, :string, null: true
    end

    def call(_conn, inputs) do
      with {:ok, account, _invite_context} <- AccountSigningUp.run(inputs.full_name, inputs.email, inputs.password, inputs.code),
           {:ok, _session, raw_token} <- CliAuthSession.create_authenticated_session(account, :password, :signup) do
        build_response(account, raw_token)
      else
        {:error, :signup_not_allowed} ->
          {:error, :forbidden}

        {:error, :email_taken} ->
          {:error, :bad_request, "Email is already registered"}

        {:error, :invalid_code} ->
          {:error, :bad_request, "Invalid activation code"}

        {:error, :not_found} ->
          {:error, :bad_request, "Invalid activation code"}

        {:error, :invalid} ->
          {:error, :bad_request, "Activation code has expired"}

        {:error, %Ecto.Changeset{} = changeset} ->
          Logger.error("Failed to create account: #{inspect(changeset)}")
          {:error, :internal_server_error, "Failed to create account"}

        {:error, error} ->
          Logger.error("Failed to sign up: #{inspect(error)}")
          {:error, :internal_server_error}
      end
    end

    defp build_response(account, raw_token) do
      companies = CliAuthSession.eligible_companies(account)

      {:ok,
       %{
         status: :authenticated,
         companies: Serializer.serialize(companies, level: :essential),
         bootstrap_token: raw_token
       }}
    end
  end

  defmodule CompanyCreationStatus do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    outputs do
      field :configured, :boolean, null: false
    end

    def call(_conn, _inputs) do
      {:ok, %{configured: Operately.Setup.configured?()}}
    end
  end

  defmodule SetupCompany do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Operations.CompanyAdding
    alias Operately.People.Account

    inputs do
      field :company_name, :string
      field? :title, :string, null: true
    end

    outputs do
      field :company, :company, null: false
      field :person, :person, null: false
    end

    def call(conn, inputs) do
      session = conn.assigns[:current_cli_auth_session]
      account = conn.assigns[:current_account]

      with :ok <- Steps.validate_token_creation_session(session),
           %{} <- account do
        if Operately.Setup.company_setup_pending?() do
          do_create_company(account, inputs)
        else
          {:error, :forbidden}
        end
      else
        {:error, :unauthorized} ->
          {:error, :unauthorized}

        nil ->
          {:error, :unauthorized}
      end
    end

    defp do_create_company(account, inputs) do
      attrs = %{
        company_name: inputs.company_name,
        title: inputs[:title]
      }

      with {:ok, company} <- CompanyAdding.run(attrs, account),
           {:ok, _} <- Account.promote_to_admin(account) do
        person = Operately.People.get_person(account, company)

        if person do
          {:ok,
           %{
             company: Serializer.serialize(company, level: :essential),
             person: Serializer.serialize(person, level: :essential)
           }}
        else
          {:error, :internal_server_error}
        end
      else
        {:error, _reason} ->
          {:error, :internal_server_error}
      end
    end
  end

  defmodule CreateCompany do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Operations.CompanyAdding

    inputs do
      field :company_name, :string
      field? :title, :string, null: true
    end

    outputs do
      field :company, :company, null: false
      field :person, :person, null: false
    end

    def call(conn, inputs) do
      session = conn.assigns[:current_cli_auth_session]
      account = conn.assigns[:current_account]

      with :ok <- Steps.validate_token_creation_session(session),
           %{} <- account do
        attrs = %{
          company_name: inputs.company_name,
          title: inputs[:title]
        }

        with {:ok, company} <- CompanyAdding.run(attrs, account) do
          person = Operately.People.get_person(account, company)

          if person do
            {:ok,
             %{
               company: Serializer.serialize(company, level: :essential),
               person: Serializer.serialize(person, level: :essential)
             }}
          else
            {:error, :internal_server_error}
          end
        else
          {:error, _reason} ->
            {:error, :internal_server_error}
        end
      else
        {:error, :unauthorized} ->
          {:error, :unauthorized}

        nil ->
          {:error, :unauthorized}
      end
    end
  end

  defmodule JoinWithInvite do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias Operately.Billing.EnforceLimits
    alias Operately.Billing.EnforceLimits.LimitError
    alias Operately.People.{Account, CliAuthSession}
    alias Operately.Repo

    inputs do
      field :token, :string, null: false
    end

    outputs do
      field :company, :company, null: false
    end

    def call(conn, inputs) do
      session = conn.assigns[:current_cli_auth_session]
      account = conn.assigns[:current_account]

      with :ok <- Steps.validate_token_creation_session(session),
           %Account{} <- account,
           {:ok, person} <- Operately.InviteLinks.join_company_via_invite_link(account, inputs.token) do
        company = Repo.preload(person, :company).company

        {:ok,
         %{
           company: Serializer.serialize(company, level: :essential)
         }}
      else
        {:error, :unauthorized} ->
          {:error, :unauthorized}

        nil ->
          {:error, :unauthorized}

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

        {:error, %LimitError{} = error} ->
          EnforceLimits.to_api_error(error)
      end
    end
  end

  defmodule SharedSteps do
    alias Operately.Billing.EnforceLimits
    alias Operately.Billing.EnforceLimits.LimitError
    alias Operately.InviteLinks
    alias Operately.People.{Account, CliAuthSession}
    alias Operately.Repo

    def check_email_login_allowed do
      if Application.get_env(:operately, :allow_login_with_email) do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end

    def fetch_account(email) do
      case Operately.People.get_account_by_email(email) do
        %Account{} = account -> {:ok, account}
        nil -> {:error, :account_not_found}
      end
    end

    def maybe_join_via_invite(account, nil), do: {:ok, account}

    def maybe_join_via_invite(account, token) do
      case InviteLinks.join_company_via_invite_link(account, token) do
        {:ok, _person} -> {:ok, account}
        {:error, reason} -> map_join_invite_error(reason)
      end
    end

    def validate_email_code_request(account, nil), do: {:ok, account}

    def validate_email_code_request(account, token) do
      case InviteLinks.get_invite_link_by_token(token) do
        {:ok, %{type: :company_wide} = invite_link} ->
          case InviteLinks.validate_invite_link(invite_link, account) do
            {:ok, _invite_link} -> {:ok, account}
            {:error, reason} -> map_company_wide_invite_validation_error(reason)
          end

        {:ok, %{type: :personal} = invite_link} ->
          invite_link = Repo.preload(invite_link, person: [:account])

          with {:ok, _invite_link} <- InviteLinks.validate_personal_invite_link(invite_link),
               {:ok, _account} <- validate_personal_invite_account(account, invite_link) do
            {:ok, account}
          else
            {:error, :invite_link_not_for_person} ->
              {:error, "Invalid invite link"}

            {:error, :first_time_invite} ->
              {:error, "Email code login isn't available for first-time invites. Set a password or use Google OAuth instead."}

            {:error, reason} ->
              map_personal_invite_validation_error(reason)
          end

        {:error, :not_found} ->
          {:error, "Invalid invite link"}
      end
    end

    def respond_with_authenticated_account(account, auth_method \\ :password, intent \\ :login) do
      companies = CliAuthSession.eligible_companies(account)

      case companies do
        [] -> no_companies_response(account, auth_method, intent)
        companies -> create_authenticated_response(account, companies, auth_method, intent)
      end
    end

    def account_not_found_message do
      "No account exists for this email. Use `operately auth signup` or `operately auth join` instead."
    end

    def email_delivery_not_configured_message do
      "Email code login isn't available because email delivery hasn't been configured. Please contact your organization administrator."
    end

    defp validate_personal_invite_account(account, invite_link) do
      person = invite_link.person

      cond do
        is_nil(person) ->
          {:error, :invite_link_not_for_person}

        person.account_id != account.id ->
          {:error, :invite_link_not_for_person}

        person.email != account.email ->
          {:error, :invite_link_not_for_person}

        is_nil(person.account) ->
          {:error, :invite_link_not_for_person}

        is_nil(person.account.first_login_at) ->
          {:error, :first_time_invite}

        true ->
          {:ok, account}
      end
    end

    defp no_companies_response(account, auth_method, intent) do
      case CliAuthSession.create_authenticated_session(account, auth_method, intent) do
        {:ok, _session, raw_token} ->
          {:ok,
           %{
             status: :no_companies,
             companies: [],
             bootstrap_token: raw_token,
             message: CliAuthSession.no_companies_message()
           }}

        {:error, _changeset} ->
          {:error, :internal_server_error}
      end
    end

    defp create_authenticated_response(account, companies, auth_method, intent) do
      case CliAuthSession.create_authenticated_session(account, auth_method, intent) do
        {:ok, _session, raw_token} ->
          {:ok,
           %{
             status: :authenticated,
             companies: OperatelyWeb.Api.Serializer.serialize(companies, level: :essential),
             bootstrap_token: raw_token
           }}

        {:error, _changeset} ->
          {:error, :internal_server_error}
      end
    end

    defp map_company_wide_invite_validation_error(:invite_link_inactive), do: {:error, "This invite link is no longer valid"}
    defp map_company_wide_invite_validation_error(:invite_link_domain_not_allowed), do: {:error, "This invite link is restricted to specific email domains"}

    defp map_personal_invite_validation_error(:invite_link_inactive), do: {:error, "This invite link is no longer valid"}
    defp map_personal_invite_validation_error(:invite_link_expired), do: {:error, "This invite link is no longer valid"}

    defp map_join_invite_error(%LimitError{} = error) do
      {:error, {EnforceLimits.public_message(error), EnforceLimits.public_details(error)}}
    end

    defp map_join_invite_error(:invite_token_not_found), do: {:error, "Invalid invite link"}
    defp map_join_invite_error(:invite_token_inactive), do: {:error, "This invite link is no longer valid"}
    defp map_join_invite_error(:invite_token_domain_not_allowed), do: {:error, "This invite link is restricted to specific email domains"}
    defp map_join_invite_error(:invite_token_invalid), do: {:error, "This invite link is no longer valid"}
    defp map_join_invite_error(:person_creation_failed), do: {:error, "Unable to add you to this company."}
    defp map_join_invite_error(:invite_link_update_failed), do: {:error, "Something went wrong while using this invite link."}

    def validate_token_creation_session(session) do
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
