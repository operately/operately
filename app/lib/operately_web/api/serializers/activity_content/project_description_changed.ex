defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectDescriptionChanged do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content.project, level: :essential),
      project_name: content.project_name,
      has_description: content.has_description,
      description: encode_description(content["description"]),
    }
  end

  defp encode_description(nil), do: nil
  defp encode_description(description) when is_binary(description), do: description
  defp encode_description(description), do: Jason.encode!(description)
end
