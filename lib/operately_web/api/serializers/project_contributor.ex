defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Contributor do
  def serialize(contributor, level: :essential) do
    %{
      id: contributor.id,
      role: Atom.to_string(contributor.role),
      responsibility: contributor.responsibility,
      access_level: contributor.access_level,
      person: OperatelyWeb.Api.Serializer.serialize(contributor.person),
    }
  end

  def serialize(contributor, level: :full) do
    contributor
    |> serialize(level: :essential)
    |> Map.merge(%{
      project: OperatelyWeb.Api.Serializer.serialize(contributor.project)
    })
  end
end
