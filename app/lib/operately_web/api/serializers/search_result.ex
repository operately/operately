defimpl OperatelyWeb.Api.Serializable, for: Operately.Search.Result do
  use Gettext, backend: OperatelyWeb.Gettext

  def serialize(result, level: :essential) do
    %{
      id: encode_id(result.id),
      type: result.type,
      title: display_title(result),
      context: result.context,
      matched_field: result.matched_field,
      snippet: result.snippet,
      state: result.state,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(result.inserted_at),
      navigation_target: serialize_navigation_target(result.navigation_target)
    }
  end

  # Search keeps canonical titles for indexing; only presentation is localized.
  defp display_title(%{type: type, title: "Check-in on " <> date}) when type in [:goal_check_in, :project_check_in], do: gettext("Check-in on %{date}", date: date)
  defp display_title(%{type: :project_retrospective, title: "Project retrospective"}), do: gettext("Project retrospective")
  defp display_title(result), do: result.title

  defp serialize_navigation_target(target) do
    %{
      resource_hub_id: encode_optional_id(target[:resource_hub_id]),
      folder_id: encode_optional_id(target[:folder_id]),
      document_id: encode_optional_id(target[:document_id]),
      file_id: encode_optional_id(target[:file_id]),
      link_id: encode_optional_id(target[:link_id]),
      space_id: encode_optional_id(target[:space_id]),
      project_id: encode_optional_id(target[:project_id]),
      goal_id: encode_optional_id(target[:goal_id]),
      milestone_id: encode_optional_id(target[:milestone_id]),
      task_id: encode_optional_id(target[:task_id]),
      person_id: encode_optional_id(target[:person_id]),
      discussion_id: encode_optional_id(target[:discussion_id]),
      project_check_in_id: encode_optional_id(target[:project_check_in_id]),
      goal_check_in_id: encode_optional_id(target[:goal_check_in_id]),
      project_retrospective_id: encode_optional_id(target[:project_retrospective_id])
    }
  end

  defp encode_optional_id(nil), do: nil
  defp encode_optional_id(id), do: encode_id(id)
  defp encode_id(id), do: Operately.ShortUuid.encode!(id)
end
