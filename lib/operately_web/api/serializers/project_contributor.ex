defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Contributor do
  def serialize(%{person: %{access_group: %{bindings: bindings}}} = contributor, level: :essential) when length(bindings) > 0 do
    %{
      id: contributor.id,
      role: Atom.to_string(contributor.role),
      responsibility: contributor.responsibility,
      person: OperatelyWeb.Api.Serializer.serialize(contributor.person),
      access_level: Enum.max_by(bindings, &(&1.access_level)).access_level,
    }
  end

  def serialize(contributor, level: :essential) do
    %{
      id: contributor.id,
      role: Atom.to_string(contributor.role),
      responsibility: contributor.responsibility,
      person: OperatelyWeb.Api.Serializer.serialize(contributor.person),
      access_level: 0,
    }
  end
end
