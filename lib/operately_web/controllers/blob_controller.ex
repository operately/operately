defmodule OperatelyWeb.BlobController do
  use OperatelyWeb, :controller

  def create(conn, %{"file" => %Plug.Upload{} = file_params}) do
    source = file_params.path
    destination = "/media/#{file_params.filename}"

    IO.inspect(file_params)
    IO.inspect(source)
    IO.inspect(destination)

    :ok = File.cp(file_params.path, "/media/#{file_params.filename}")

    conn
    |> put_status(:ok)
    |> json(%{
      message: "File uploaded successfully",
      path: destination
    })
  end

end
