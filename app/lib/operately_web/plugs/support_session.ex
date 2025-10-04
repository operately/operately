defmodule OperatelyWeb.Plugs.SupportSession do
  import Plug.Conn

  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.People
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.Repo.RequestInfo

  @session_key :support_session
  @max_session_minutes 60

  def init(opts), do: opts

  def call(conn, _opts) do
    Process.delete(:support_session_read_only)
    Process.delete(:support_session_access_limit)

    case normalize_session(get_session(conn, @session_key)) do
      {:ok, session} -> activate_support_mode(conn, session)
      :error -> conn
    end
  end

  defp activate_support_mode(conn, session) do
    case activate_session(conn, session) do
      {:ok, conn} -> conn
      {:error, conn} -> conn
    end
  end

  defp activate_session(conn, session) do
    with {:ok, _account} <- ensure_account(conn, session),
         {:ok, started_at} <- ensure_not_expired(session.started_at),
         {:ok, person} <- load_person(session.person_id),
         {:ok, company} <- load_company(session.company_id) do
      access_limit = Binding.view_access()
      decorated_person = decorate_person(person, access_limit)

      Process.put(:support_session_read_only, true)
      Process.put(:support_session_access_limit, access_limit)

      conn =
        conn
        |> assign(:support_person, decorated_person)
        |> assign(:support_company, company)
        |> assign(:support_mode, true)
        |> assign(:support_session, %{person: decorated_person, company: company, started_at: started_at})

      {:ok, enforce_read_only(conn)}
    else
      _ -> {:error, drop_support_session(conn)}
    end
  end

  defp ensure_account(conn, session) do
    case conn.assigns[:current_account] do
      %Account{id: id} when id == session.original_account_id -> {:ok, conn.assigns[:current_account]}
      _ -> {:error, :account_mismatch}
    end
  end

  defp ensure_not_expired(nil), do: {:error, :expired}

  defp ensure_not_expired(started_at) do
    case DateTime.diff(DateTime.utc_now(), started_at, :minute) do
      diff when diff <= @max_session_minutes -> {:ok, started_at}
      _ -> {:error, :expired}
    end
  end

  defp load_person(person_id) do
    case People.get_person(person_id) do
      %Person{} = person -> {:ok, person}
      nil -> {:error, :not_found}
    end
  end

  defp load_company(company_id) do
    case Repo.get(Company, company_id) do
      %Company{} = company -> {:ok, company}
      nil -> {:error, :not_found}
    end
  end

  defp decorate_person(person, access_level) do
    request_info = %RequestInfo{requester: person, access_level: access_level, is_system_request: false}

    person
    |> Person.set_requester_access_level(access_level)
    |> Map.put(:request_info, request_info)
  end

  defp enforce_read_only(conn) do
    if conn.method in ["POST", "PUT", "PATCH", "DELETE"] and String.starts_with?(conn.request_path, "/api/") do
      conn
      |> send_resp(403, "Support session is read-only.")
      |> halt()
    else
      conn
    end
  end

  defp drop_support_session(conn) do
    delete_session(conn, @session_key)
  end

  defp normalize_session(%{person_id: person_id, company_id: company_id, original_account_id: account_id, started_at: started_at})
       when not is_nil(person_id) and not is_nil(company_id) and not is_nil(account_id) do
    {:ok,
     %{
       person_id: person_id,
       company_id: company_id,
       original_account_id: account_id,
       started_at: started_at
     }}
  end

  defp normalize_session(%{"person_id" => person_id, "company_id" => company_id, "original_account_id" => account_id, "started_at" => started_at})
       when not is_nil(person_id) and not is_nil(company_id) and not is_nil(account_id) do
    normalize_session(%{person_id: person_id, company_id: company_id, original_account_id: account_id, started_at: started_at})
  end

  defp normalize_session(_), do: :error
end
