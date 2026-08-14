defmodule Operately.ProjectTemplates.Comments.ReverseCopy do
  import Ecto.Query, only: [from: 2]

  alias Operately.Comments.MilestoneComment
  alias Operately.ProjectTemplates.Comment
  alias Operately.Updates.Comment, as: RuntimeComment

  @source_types [:comment_thread, :project_milestone, :project_task, :resource_hub_document, :resource_hub_file, :resource_hub_link]

  def run(_repo, _project_id, _template, parent_ids) when parent_ids == %{}, do: {:ok, []}

  def run(repo, _project_id, template, parent_ids) do
    comments = load_comments(repo, source_ids(parent_ids))

    comments
    |> Enum.reduce_while({:ok, %{}}, fn comment, {:ok, positions} ->
      case destination(comment, parent_ids) do
        nil ->
          {:cont, {:ok, positions}}

        {parent_type, parent_id} ->
          position = Map.get(positions, {parent_type, parent_id}, 0)

          attrs = %{
            id: Ecto.UUID.generate(),
            project_template_id: template.id,
            author_id: comment.author_id,
            parent_type: parent_type,
            parent_id: parent_id,
            content: comment.content,
            position: position
          }

          case repo.insert(Comment.changeset(attrs)) do
            {:ok, _copied} -> {:cont, {:ok, Map.put(positions, {parent_type, parent_id}, position + 1)}}
            {:error, changeset} -> {:halt, {:error, {:invalid_source_child, :comment, changeset}}}
          end
      end
    end)
    |> case do
      {:ok, _positions} -> {:ok, :copied}
      error -> error
    end
  end

  defp source_ids(parent_ids) do
    parent_ids
    |> Map.values()
    |> Enum.flat_map(&Map.keys/1)
  end

  defp load_comments(_repo, []), do: []

  defp load_comments(repo, source_ids) do
    from(comment in RuntimeComment,
      left_join: join in MilestoneComment,
      on: join.comment_id == comment.id,
      where: comment.entity_id in ^source_ids and comment.entity_type in ^@source_types,
      where: comment.entity_type != :project_milestone or join.action == :none,
      order_by: [asc: comment.inserted_at, asc: comment.id]
    )
    |> repo.all()
  end

  defp destination(%{entity_type: :comment_thread, entity_id: id}, parent_ids), do: lookup(parent_ids, :discussion, id)
  defp destination(%{entity_type: :project_milestone, entity_id: id}, parent_ids), do: lookup(parent_ids, :milestone, id)
  defp destination(%{entity_type: :project_task, entity_id: id}, parent_ids), do: lookup(parent_ids, :task, id)
  defp destination(%{entity_type: :resource_hub_document, entity_id: id}, parent_ids), do: lookup(parent_ids, :document, id)
  defp destination(%{entity_type: :resource_hub_file, entity_id: id}, parent_ids), do: lookup(parent_ids, :file, id)
  defp destination(%{entity_type: :resource_hub_link, entity_id: id}, parent_ids), do: lookup(parent_ids, :link, id)
  defp destination(_comment, _parent_ids), do: nil

  defp lookup(parent_ids, parent_type, source_id) do
    case get_in(parent_ids, [parent_type, source_id]) do
      nil -> nil
      parent_id -> {parent_type, parent_id}
    end
  end
end
