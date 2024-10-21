defmodule OperatelyWeb.BlobController do
  use OperatelyWeb, :controller

  def get(conn, params) do
    id = Map.get(params, "id")
    disposition = Map.get(params, "disposition", "inline")

    cond do
      id == nil -> 
        conn |> put_status(400) |> text("Missing id")

      !Operately.Blobs.is_valid_disposition?(disposition) -> 
        conn |> put_status(400) |> text("Invalid disposition")

      true ->
        blob = Operately.Blobs.get_blob!(id)
        {:ok, url} = Operately.Blobs.get_signed_get_url(blob, disposition)

        conn |> redirect(external: url)
    end
  end

end
