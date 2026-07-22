defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.DocumentVersion do
  def serialize(version, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(version.id),
      version_number: version.version_number,
      title: version.title,
      editor: OperatelyWeb.Api.Serializer.serialize(version.editor),
      origin: Atom.to_string(version.origin),
      restored_from_version_number: version.restored_from_version_number,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(version.inserted_at),
      is_current: version.is_current == true,
      title_changed: version.title_changed == true,
      content_changed: version.content_changed == true,
    }
  end

  def serialize(version, level: :full) do
    serialize(version, level: :essential)
    |> Map.merge(%{
      content: version.content,
    })
  end
end
