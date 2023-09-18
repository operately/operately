defmodule OperatelyWeb.BlobController do
  use OperatelyWeb, :controller

  def get(conn, %{"id" => id}) do
    blob = Operately.Blobs.get_blob!(id)
    url = Operately.Blobs.get_signed_get_url(blob)

    conn |> redirect(external: url)
  end

end
