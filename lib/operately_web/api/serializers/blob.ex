defimpl OperatelyWeb.Api.Serializable, for: Operately.Blobs.Blob do
  def serialize(blob, level: :essential) do
    %{
      id: OperatelyWeb.Paths.blob_id(blob),
      status: Atom.to_string(blob.status),
      filename: blob.filename,
      size: blob.size,
      content_type: blob.content_type,
      height: blob.height,
      width: blob.width,
      url: Ecto.assoc_loaded?(blob) && Operately.Blobs.Blob.url(blob),
    }
  end
end
