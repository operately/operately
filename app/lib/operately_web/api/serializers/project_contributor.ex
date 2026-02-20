defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Contributor do
  def serialize(contributor, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_contributor_id(contributor),
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
      project: OperatelyWeb.Api.Serializer.serialize(contributor.project),
      permissions: OperatelyWeb.Api.Serializer.serialize(contributor.permissions)
    })
  end
end
