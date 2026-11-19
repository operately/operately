defmodule OperatelyWeb.DatabaseErrorsTest do
  use ExUnit.Case, async: true

  alias OperatelyWeb.DatabaseErrors
  import Plug.Conn

  test "recognizes queue drops by their structured reason regardless of message or severity" do
    for severity <- [:error, :warning] do
      error = %DBConnection.ConnectionError{reason: :queue_timeout, message: "Arbitrary diagnostic", severity: severity}
      assert DatabaseErrors.queue_timeout?(error)
    end
  end

  test "recognizes queue errors preserved by Plug's exception wrapper" do
    error = queue_error()
    wrapped = wrap_error(error)

    assert DatabaseErrors.queue_timeout?(wrapped)
  end

  test "does not infer queue overload from unrelated errors, messages, maps, or exits" do
    errors = [
      %DBConnection.ConnectionError{reason: :error, message: "request was dropped from queue after 110ms"},
      RuntimeError.exception("DBConnection.ConnectionError: queue_timeout"),
      %Postgrex.Error{message: "query timed out"},
      :timeout,
      {:timeout, {Task, :await, []}},
      {:error, queue_error()},
      %{reason: :queue_timeout},
      wrap_error(RuntimeError.exception("unrelated failure")),
      %Plug.Conn.WrapperError{kind: :exit, reason: queue_error(), stack: []},
      %Plug.Conn.WrapperError{kind: :throw, reason: queue_error(), stack: []}
    ]

    for error <- errors do
      refute DatabaseErrors.queue_timeout?(error)
      assert DatabaseErrors.respond(Plug.Test.conn(:get, "/"), error) == :unhandled
    end
  end

  test "returns a non-cacheable JSON 503 without exposing diagnostics or suggesting a retry delay" do
    conn =
      Plug.Test.conn(:get, "/")
      |> put_resp_header("cache-control", "public, max-age=3600")
      |> put_resp_header("retry-after", "60")

    Gettext.with_locale(OperatelyWeb.Gettext, "en", fn ->
      assert {:ok, response} = DatabaseErrors.respond(conn, queue_error())
      assert response.status == 503
      assert response.state == :sent
      assert response.halted
      assert get_resp_header(response, "content-type") == ["application/json; charset=utf-8"]
      assert get_resp_header(response, "cache-control") == ["no-store"]
      assert get_resp_header(response, "retry-after") == []

      assert Jason.decode!(response.resp_body) == %{
               "error" => "Service Unavailable",
               "code" => "database_connection_queue_timeout",
               "message" => "The service is temporarily unavailable. Please try again."
             }
    end)
  end

  test "translates the message while preserving the protocol fields for wrapped queue errors" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert {:ok, response} = DatabaseErrors.respond(Plug.Test.conn(:post, "/"), wrap_error(queue_error()))

      assert Jason.decode!(response.resp_body) == %{
               "error" => "Service Unavailable",
               "code" => "database_connection_queue_timeout",
               "message" => "O serviço está temporariamente indisponível. Tente novamente."
             }
    end)
  end

  test "returns HTML for browser routes without requiring fetched params" do
    conn = Plug.Test.conn(:get, "/") |> Phoenix.Controller.put_format("html")

    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert {:ok, response} = DatabaseErrors.respond(conn, queue_error())
      assert response.status == 503
      assert get_resp_header(response, "content-type") == ["text/html; charset=utf-8"]
      assert get_resp_header(response, "cache-control") == ["no-store"]
      html = Floki.parse_document!(response.resp_body)
      assert Floki.attribute(html, "html", "lang") == ["pt-BR"]
      assert Floki.attribute(html, "main", "data-status") == ["503"]
      assert Floki.attribute(html, "a", "href") == ["/"]
      assert Floki.text(Floki.find(html, "h1")) == "Temporariamente indisponível"
      assert Floki.find(html, "script") == []
      refute response.resp_body =~ "Sensitive database diagnostic"
    end)
  end

  test "leaves unrelated responses to the caller's existing error handling" do
    conn = Plug.Test.conn(:get, "/") |> resp(403, "existing denial")
    assert DatabaseErrors.respond(conn, :forbidden) == :unhandled
    refute_received {:plug_conn, :sent}
  end

  test "does not replace a response whose headers have already been sent" do
    for response_type <- [:complete, :chunked] do
      conn = Plug.Test.conn(:get, "/")

      conn =
        case response_type do
          :complete -> send_resp(conn, 200, "already sent")
          :chunked -> send_chunked(conn, 200)
        end

      assert DatabaseErrors.respond(conn, queue_error()) == :unhandled
    end
  end

  test "a real exhausted pool produces the classified 503 without querying the database to render it" do
    options =
      Operately.Repo.config()
      |> Keyword.take([:hostname, :port, :username, :password, :database, :socket_dir, :ssl, :socket_options])
      |> Keyword.merge(pool_size: 1, queue_target: 1, queue_interval: 10)

    pool = start_supervised!({Postgrex, options})
    Postgrex.query!(pool, "SELECT 1", [])
    owner = self()

    holder =
      Task.async(fn ->
        DBConnection.run(pool, fn _ ->
          send(owner, :checked_out)

          receive do
            :release -> :ok
          end
        end)
      end)

    assert_receive :checked_out

    try do
      assert {:error, error} = Postgrex.query(pool, "SELECT 1", [], timeout: 2_000)
      assert DatabaseErrors.queue_timeout?(error)
      assert {:ok, conn} = DatabaseErrors.respond(Plug.Test.conn(:get, "/"), error)
      assert conn.status == 503
      assert Jason.decode!(conn.resp_body)["code"] == "database_connection_queue_timeout"
    after
      send(holder.pid, :release)
      Task.await(holder)
    end

    assert {:ok, _} = Postgrex.query(pool, "SELECT 1", [])
  end

  defp queue_error do
    %DBConnection.ConnectionError{reason: :queue_timeout, message: "Sensitive database diagnostic"}
  end

  defp wrap_error(error) do
    try do
      Plug.Conn.WrapperError.reraise(Plug.Test.conn(:get, "/"), :error, error, [])
    rescue
      wrapped in Plug.Conn.WrapperError -> wrapped
    end
  end
end
