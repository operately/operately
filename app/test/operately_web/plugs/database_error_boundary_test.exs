defmodule OperatelyWeb.Plugs.DatabaseErrorBoundaryTest do
  use ExUnit.Case, async: false

  import Mock
  import Plug.Conn
  alias OperatelyWeb.Plugs.DatabaseErrorBoundary

  test "passes successful routing through unchanged" do
    conn = Plug.Test.conn(:get, "/")

    with_mock OperatelyWeb.Router, [:passthrough], call: fn conn, _ -> conn end do
      assert DatabaseErrorBoundary.call(conn, []) == conn
    end
  end

  test "uses the wrapped connection and reraises the same exception" do
    conn = Plug.Test.conn(:get, "/api/v2/get_theme")
    latest = conn |> put_resp_header("x-preserved", "yes") |> Phoenix.Controller.put_format("json")
    reason = %DBConnection.ConnectionError{reason: :queue_timeout, message: "diagnostic"}
    wrapped = %Plug.Conn.WrapperError{conn: latest, kind: :error, reason: reason, stack: []}

    with_mock OperatelyWeb.Router, [:passthrough], call: fn _, _ -> raise wrapped end do
      assert assert_raise(Plug.Conn.WrapperError, fn -> DatabaseErrorBoundary.call(conn, []) end) == wrapped
      assert {503, headers, _} = Plug.Test.sent_resp(conn)
      assert {"x-preserved", "yes"} in headers
    end
  end

  test "does not render unrelated exceptions, throws, or exits" do
    conn = Plug.Test.conn(:get, "/")
    error = %DBConnection.ConnectionError{reason: :error, message: "not a queue timeout"}

    with_mock OperatelyWeb.Router, [:passthrough], call: fn _, _ -> raise error end do
      assert assert_raise(DBConnection.ConnectionError, fn -> DatabaseErrorBoundary.call(conn, []) end) == error
    end

    with_mock OperatelyWeb.Router, [:passthrough], call: fn _, _ -> exit(:timeout) end do
      assert catch_exit(DatabaseErrorBoundary.call(conn, [])) == :timeout
    end

    with_mock OperatelyWeb.Router, [:passthrough], call: fn _, _ -> throw(:failure) end do
      assert catch_throw(DatabaseErrorBoundary.call(conn, [])) == :failure
    end

    refute_received {:plug_conn, :sent}
  end
end
