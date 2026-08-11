defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.Discussion do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(discussion, level: :essential) do
    %{
      id: Paths.project_template_discussion_id(discussion),
      project_template_id: Paths.project_template_id(discussion.project_template_id),
      title: discussion.title,
      body: Jason.encode!(discussion.body),
      author: Serializer.serialize(discussion.author),
      position: discussion.position,
      inserted_at: Serializer.serialize(discussion.inserted_at),
      updated_at: Serializer.serialize(discussion.updated_at)
    }
  end

  def serialize(discussion, level: :full), do: serialize(discussion, level: :essential)
end
