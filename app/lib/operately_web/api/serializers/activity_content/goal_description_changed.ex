defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalDescriptionChanged do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal: Serializer.serialize(content.goal, level: :essential),
      goal_name: content.goal_name,
      has_description: content.has_description,
      old_description: encode_description(content["old_description"]),
      new_description: Jason.encode!(content["new_description"])
    }
  end

  defp encode_description(nil), do: nil
  defp encode_description(description), do: Jason.encode!(description)
end
