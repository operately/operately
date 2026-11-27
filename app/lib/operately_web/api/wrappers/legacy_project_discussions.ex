defmodule OperatelyWeb.Api.Wrappers.LegacyProjectDiscussions do
  @moduledoc "Translates legacy external comment and subscription types before the normal resource lookup."

  import Ecto.Query
  alias Operately.{Comments.CommentThread, Messages.Message, Repo, Updates.Comment}

  def normalize(%{assigns: %{api_auth_mode: mode}}, inputs) when mode in [:api_token, :mcp_oauth], do: normalize_external(inputs)
  def normalize(_conn, inputs), do: inputs

  defp normalize_external(%{entity_type: :project_discussion, entity_id: id} = inputs) do
    if Repo.exists?(where(project_threads(), [t], t.id == ^id)), do: %{inputs | entity_type: :comment_thread}, else: inputs
  end

  defp normalize_external(%{parent_type: :project_discussion} = inputs) do
    id = Map.get(inputs, :comment_id) || inputs.entity_id
    query = from(t in project_threads(), join: c in Comment, on: c.entity_id == t.id, where: c.entity_type == :comment_thread and c.id == ^id)
    if Repo.exists?(query), do: %{inputs | parent_type: :comment_thread}, else: inputs
  end

  defp normalize_external(%{resource_type: :comment_thread, resource_id: id} = inputs) do
    if project_discussion?(id: id), do: %{inputs | resource_type: :project_discussion}, else: inputs
  end

  defp normalize_external(%{type: :comment_thread, subscription_list_id: id} = inputs) do
    if project_discussion?(subscription_list_id: id), do: %{inputs | type: :project_discussion}, else: inputs
  end

  defp normalize_external(inputs), do: inputs

  defp project_discussion?(filters), do: Repo.exists?(where(Message.published_project_discussions(Message), ^filters))

  defp project_threads do
    from(t in CommentThread,
      join: a in assoc(t, :activity),
      where: t.parent_type == :activity and t.parent_id == a.id and not is_nil(a.content["project_id"])
    )
  end
end
