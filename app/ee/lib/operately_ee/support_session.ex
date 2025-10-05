defmodule OperatelyEE.SupportSession do
  @moduledoc """
  Handles support session functionality for site administrators.
  """

  require Logger

  @doc """
  Checks if the current request is in a support session and returns the person.
  """
  def get_as_person(conn, account, company) do
    with(
      true <- Operately.People.Account.is_site_admin?(account),
      {:ok, %{company_id: cookie_company_id, person_id: person_id}} <- decode_support_session_cookie(conn),
      company_id when is_binary(company_id) <- OperatelyWeb.Paths.company_id(company),
      true <- cookie_company_id == company_id
    ) do
      {:ok, Operately.People.get_person!(person_id)}
    else
      _ -> {:error, :not_support_session}
    end
  end

  @doc """
  Decodes and validates the support session cookie.
  Returns the session data if valid and not expired.
  """
  def decode_support_session_cookie(conn) do
    conn = Plug.Conn.fetch_cookies(conn)

    case conn.cookies["support_session_token"] do
      nil ->
        {:error, :no_cookie}

      encrypted_token ->
        case Phoenix.Token.decrypt(OperatelyWeb.Endpoint, "support_session", encrypted_token) do
          {:ok, %{expires_at: expires_at, company_id: company_id, person_id: person_id}} ->
            if DateTime.compare(DateTime.utc_now(), expires_at) == :lt do
              {:ok, %{company_id: company_id, person_id: person_id}}
            else
              {:error, :expired}
            end

          {:error, _} ->
            {:error, :invalid_token}
        end
    end
  end

  @doc """
  Creates an encrypted support session token for the given admin and company.
  Selects the first owner to impersonate.
  """
  def create_support_session_token(admin_account, company) do
    # Get the first owner to impersonate during this session
    owners = Operately.Companies.list_owners(company)

    case owners do
      [] ->
        {:error, :no_owners}
      [owner | _] ->
        data = %{
          admin_id: admin_account.id,
          company_id: OperatelyWeb.Paths.company_id(company),
          person_id: owner.id,
          expires_at: DateTime.utc_now() |> DateTime.add(3600, :second), # 1 hour
          session_id: Ecto.UUID.generate()
        }

        encrypted_token = Phoenix.Token.encrypt(OperatelyWeb.Endpoint, "support_session", data)
        {:ok, encrypted_token}
    end
  end

  @doc """
  Checks if support session functionality is available (EE feature).
  """
  def available?, do: true
end
