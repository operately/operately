defmodule OperatelyWeb.BlobController do
  use OperatelyWeb, :controller

  def create(conn, %{"path" => path, "file" => %Plug.Upload{} = file_params}) do
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

end
