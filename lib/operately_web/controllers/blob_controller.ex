defmodule OperatelyWeb.BlobController do
  use OperatelyWeb, :controller

  def get(conn, %{"path" => path}) do
    case Operately.Blobs.Tokens.validate(:get, path, conn.query_params["token"]) do
      :ok -> handle_file_get(conn, path)
      {:error, :invalid_token} -> send_invalid_token(conn)
    end
  end

  def create(conn, %{"path" => path, "file" => %Plug.Upload{} = file_params, "token" => token}) do
    case Operately.Blobs.Tokens.validate(:upload, path, token) do
      :ok -> handle_file_upload(conn, path, file_params)
      {:error, :invalid_token} -> send_invalid_token(conn)
    end
  end

  defp handle_file_upload(conn, path, file_params) do
    source = file_params.path
    destination = "/media/#{path}"

    :ok = File.cp(source, destination)

    conn
    |> put_status(:ok)
    |> json(%{
      message: "File uploaded successfully",
      path: destination
    })
  end

  defp handle_file_get(conn, path) do
    send_file(conn, 200, "/media/#{path}")
  end

  defp send_invalid_token(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{message: "Invalid token"})
  end

end
