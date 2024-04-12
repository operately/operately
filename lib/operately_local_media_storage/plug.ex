defmodule OperatelyLocalMediaStorage.Plug do
  use Plug.Router

  plug Plug.Logger
  plug :match
  plug :verify_token
  plug :dispatch

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason

  get "*path" do
    send_file(conn, 200, "/media/#{path}")
  end

  post "*path" do
    source = conn.body_params["file"].path
    destination = "/media/#{path}"

    :ok = File.cp(source, destination)

    json_response(conn, 200, %{message: "File uploaded successfully"})
  end

  match _ do
    send_resp(conn, 401, "Unauthorized")
  end

  #
  # Utils
  #

  def verify_token(conn, _) do
    path = conn.params["path"] |> List.first()
    token = conn.query_params["token"] || conn.body_params["token"]

    operation = case conn.method do
      "GET" -> "get"
      "POST" -> "upload"
    end

    case Operately.Blobs.Tokens.validate(operation, path, token) do
      :ok -> conn
      {:error, _} -> send_invalid_token(conn)
    end
  end

  defp send_invalid_token(conn) do
    json_response(conn, 401, %{message: "Invalid token"})
  end

  defp json_response(conn, status_code, data) do
    conn
    |> Plug.Conn.put_resp_content_type("application/json")
    |> Plug.Conn.send_resp(status_code, Jason.encode!(data))
    |> Plug.Conn.halt()
  end
end
