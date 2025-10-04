defmodule OperatelyWeb.SupportSessionController do
  use OperatelyWeb, :controller

  alias Operately.Companies.Company
  alias Operately.People
  alias Operately.People.AccountToken
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Repo

  @session_key :support_session

  plug :require_site_admin

  def create(conn, %{"token" => token}) do
    case start_session(conn, token) do
      {:ok, company} ->
        conn
        |> put_flash(:info, "Support session started for #{company.name}.")
        |> redirect(to: OperatelyWeb.Paths.home_path(company))

      {:error, message} ->
        conn
        |> put_flash(:error, message)
        |> redirect(to: "/admin")
    end
  end

  def delete(conn, _params) do
    conn
    |> delete_session(@session_key)
    |> put_flash(:info, "Support session ended.")
    |> redirect(to: "/admin")
  end

  defp start_session(conn, token) do
    with {:ok, account} <- current_account(conn),
         {:ok, query} <- AccountToken.verify_support_session_token_query(token),
         {:ok, token_record} <- fetch_token(query),
         true <- token_record.account_id == account.id || {:error, :forbidden},
         {:ok, person} <- load_person(token_record.sent_to),
         {:ok, company} <- load_company(person.company_id) do
      Repo.delete(token_record)

      conn
      |> put_session(@session_key, %{
        person_id: person.id,
        company_id: company.id,
        original_account_id: account.id,
        started_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })

      {:ok, company}
    else
      {:error, :forbidden} -> {:error, "You are not allowed to use this support session."}
      {:error, :not_found} -> {:error, "Support session link is no longer valid."}
      {:error, :unauthorized} -> {:error, "You need to be signed in to start a support session."}
      {:error, _} -> {:error, "We could not start the support session. Please try again."}
    end
  end

  defp current_account(conn) do
    case conn.assigns[:current_account] do
      %Account{} = account -> {:ok, account}
      _ -> {:error, :unauthorized}
    end
  end

  defp fetch_token(query) do
    case Repo.one(query) do
      %AccountToken{} = token -> {:ok, token}
      nil -> {:error, :not_found}
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

  defp require_site_admin(conn, _opts) do
    case conn.assigns[:current_account] do
      %Account{site_admin: true} -> conn
      _ ->
        conn
        |> put_flash(:error, "You are not authorized to access that page.")
        |> redirect(to: "/admin")
        |> halt()
    end
  end
end
