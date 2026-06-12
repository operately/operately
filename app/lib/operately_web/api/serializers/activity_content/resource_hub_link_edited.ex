defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkEdited do
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    previous_link = content["previous_link"] || %{}

    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      link: ResourceHubActivity.serialize_resource(content, "link"),

      previous_name: previous_link[:name],
      previous_type: previous_link[:type],
      previous_url: previous_link[:url],
    })
  end
end
