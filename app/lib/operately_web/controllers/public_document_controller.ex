defmodule OperatelyWeb.PublicDocumentController do
  use OperatelyWeb, :controller

  alias Operately.Blobs
  alias Operately.ResourceHubs.PublicDocument

  def show(conn, params) do
    conn |> put_public_headers() |> put_view(html: OperatelyWeb.PageHTML) |> OperatelyWeb.PageController.index(params)
  end

  def blob(conn, %{"token" => token, "id" => id} = params) do
    conn = put_public_headers(conn)

    with {:ok, document} <- PublicDocument.find_document(token),
         true <- id in PublicDocument.blob_ids(document.content),
         {:ok, uuid} <- Ecto.UUID.cast(id),
         %Blobs.Blob{status: :uploaded, purpose: :company_file} = blob <- Operately.Repo.get(Blobs.Blob, uuid),
         true <- same_company?(document, blob) do
      send_blob(conn, blob, params["disposition"])
    else
      _ -> send_resp(conn, 404, "Document unavailable")
    end
  end

  defp same_company?(document, blob) do
    document = Operately.Repo.preload(document, :resource_hub)
    Operately.ResourceHubs.Parent.company_id(document.resource_hub) == blob.company_id
  end

  def put_public_headers(conn) do
    conn
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_header("x-robots-tag", "noindex, nofollow, noarchive")
    |> put_resp_header("referrer-policy", "no-referrer")
  end

  # Proxy the bytes so a storage URL cannot outlive the public sharing token.
  defp send_blob(conn, blob, disposition) do
    path = Path.join(System.tmp_dir!(), "public-document-" <> Ecto.UUID.generate())

    try do
      case Blobs.download_blob_to_file(blob, path) do
        :ok ->
          stream_blob(conn, blob, path, disposition)

        {:error, _} -> send_resp(conn, 502, "Unable to load attachment")
      end
    after
      File.rm(path)
    end
  end

  defp stream_blob(conn, blob, path, disposition) do
    conn =
      conn
      |> put_resp_header("x-content-type-options", "nosniff")
      |> put_resp_content_type(blob.content_type, nil)
      |> put_resp_header("content-disposition", content_disposition(blob, disposition))
      |> send_chunked(200)

    # Cowboy defers send_file reads. Send bytes here before the temporary file is removed.
    path
    |> File.stream!(64 * 1024)
    |> Enum.reduce_while(conn, fn bytes, conn ->
      case chunk(conn, bytes) do
        {:ok, conn} -> {:cont, conn}
        {:error, _reason} -> {:halt, conn}
      end
    end)
  end

  defp content_disposition(blob, requested_disposition) do
    inline = requested_disposition != "attachment" and blob.content_type in ["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif", "video/mp4", "video/webm"]
    disposition = if inline, do: "inline", else: "attachment"
    filename = URI.encode(blob.filename, &URI.char_unreserved?/1)
    header = ~s[#{disposition}; filename="#{filename}"]

    if filename == blob.filename, do: header, else: header <> "; filename*=utf-8''#{filename}"
  end
end
