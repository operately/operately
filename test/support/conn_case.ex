defmodule OperatelyWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use OperatelyWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint OperatelyWeb.Endpoint

      use OperatelyWeb, :verified_routes

      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import OperatelyWeb.ConnCase
    end
  end

  setup tags do
    Operately.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  @doc """
  Setup helper that registers and logs in accounts.

      setup :register_and_log_in_account

  It stores an updated connection and a registered account in the
  test context.
  """
  def register_and_log_in_account(%{conn: conn}) do
    company = Operately.CompaniesFixtures.company_fixture()
    account = Operately.PeopleFixtures.account_fixture()
    person = Operately.PeopleFixtures.person_fixture(%{
      account_id: account.id,
      company_id: company.id
    })

    %{
      conn: log_in_account(conn, account), 
      account: account, 
      company: company, 
      person: person
    }
  end

  @doc """
  Logs the given `account` into the `conn`.

  It returns an updated `conn`.
  """
  def log_in_account(conn, account) do
    token = Operately.People.generate_account_session_token(account)

    conn
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:account_token, token)
  end
end
