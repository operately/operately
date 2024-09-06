defimpl OperatelyWeb.Api.Serializable, for: Operately.People.Person do
  def serialize(%{access_group: %{bindings: bindings}} = data, level: :essential) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      title: data.title,
      access_level: find_access_level(bindings),
    }
  end

  def serialize(data, level: :essential) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      title: data.title,
      has_open_invitation: data.has_open_invitation,
    }
  end

  def serialize(data, level: :full) do
    %{
      id: OperatelyWeb.Paths.person_id(data),
      full_name: data.full_name,
      email: data.email,
      avatar_url: data.avatar_url,
      title: data.title,
      suspended: data.suspended,
      timezone: data.timezone,
      manager: OperatelyWeb.Api.Serializer.serialize(data.manager),
      reports: OperatelyWeb.Api.Serializer.serialize(data.reports),
      peers: OperatelyWeb.Api.Serializer.serialize(data.peers),
      has_open_invitation: data.has_open_invitation,
      invitation: data.invitation && OperatelyWeb.Api.Serializer.serialize(data.invitation),
    }
  end

  defp find_access_level(bindings) do
    Enum.max_by(bindings, &(&1.access_level)).access_level
  end
end
