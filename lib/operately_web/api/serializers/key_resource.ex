defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.KeyResource do
  def serialize(key_resource, level: :essential) do
    %{
      id: OperatelyWeb.Paths.key_resource_id(key_resource),
      project_id: OperatelyWeb.Paths.project_id(key_resource.project),
      title: key_resource.title,
      link: key_resource.link,
      resource_type: key_resource.resource_type,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(key_resource.inserted_at),
    }
  end

  def serialize(key_resource, level: :full) do
    serialize(key_resource, level: :essential)
  end
end
