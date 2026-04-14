defmodule OperatelyLocalMediaStorage.Plug do
  use Plug.Router

  plug Plug.Logger
  plug :match
  plug :verify_token
  plug :dispatch

  get "*path" do
    disposition = conn.query_params["disposition"] || "inline"
    filename = conn.query_params["filename"] || path

    conn
    |> put_cache_headers()
    |> put_content_disposition(disposition, filename)
    |> send_file(200, "/media/#{path}")
  end

  put "*path" do
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

  def put_cache_headers(conn) do
    conn |> Plug.Conn.put_resp_header("cache-control", "public, max-age=31536000, immutable")
  end

  def put_content_disposition(conn, disposition, filename) do
    case Operately.Blobs.SignedUrls.is_valid_disposition?(disposition) do
      true ->
        filename = filename |> URI.decode_www_form() |> escape_filename()
        Plug.Conn.put_resp_header(conn, "content-disposition", ~s(#{disposition}; filename="#{filename}"))

      false ->
        conn
    end
  end

  def verify_token(conn, _) do
    if conn.method == "OPTIONS" do
      conn
    else
      path = conn.params["path"] && List.first(conn.params["path"])
      token = conn.query_params["token"] || conn.body_params["token"]

      operation =
        case conn.method do
          "GET" -> "get"
          "PUT" -> "upload"
        end

      case Operately.Blobs.Tokens.validate(operation, path, token) do
        :ok -> conn
        {:error, _} -> send_invalid_token(conn)
      end
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

  defp escape_filename(filename) do
    filename
    |> String.replace("\\", "\\\\")
    |> String.replace("\"", "\\\"")
  end
end
