defimpl OperatelyWeb.Api.Serializable, for: Operately.CuratedTemplates.Template do
  def serialize(template, level: :essential) do
    %{
      id: OperatelyWeb.Paths.curated_template_id(template),
      type: template.type,
      title: template.title,
      summary: template.summary,
      category: template.category,
      content_language: template.content_language,
      state: template.state,
      published_at: template.published_at,
      archived_at: template.archived_at,
      inserted_at: template.inserted_at,
      updated_at: template.updated_at
    }
  end

  def serialize(template, level: :full) do
    serialize(template, level: :essential)
    |> Map.put(:definition, Jason.encode!(template.definition))
  end
end
