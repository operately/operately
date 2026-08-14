defmodule Operately.ProjectTemplates.Comments.Materialization do
  alias Operately.Comments.MilestoneComment
  alias Operately.ProjectTemplates.Discussion
  alias Operately.Updates.Comment, as: RuntimeComment

  @runtime_types %{
    discussion: :comment_thread,
    milestone: :project_milestone,
    task: :project_task,
    document: :resource_hub_document,
    file: :resource_hub_file,
    link: :resource_hub_link
  }

  def run(repo, comments, parent_ids, company_id, creator_id) do
    comments
    |> Enum.sort_by(&{&1.parent_type, &1.parent_id, &1.position, &1.id})
    |> Enum.reduce_while({:ok, []}, fn comment, {:ok, inserted} ->
      case get_in(parent_ids, [comment.parent_type, comment.parent_id]) do
        nil ->
          {:cont, {:ok, inserted}}

        entity_id ->
          copy_comment(repo, comment, entity_id, company_id, creator_id, inserted)
      end
    end)
  end

  defp copy_comment(repo, comment, entity_id, company_id, creator_id, inserted) do
    attrs = %{
      id: Ecto.UUID.generate(),
      author_id: active_author_id(comment.author, company_id, creator_id),
      entity_id: entity_id,
      entity_type: Map.fetch!(@runtime_types, comment.parent_type),
      content: comment.content
    }

    with {:ok, copied} <- insert_comment(repo, attrs),
         :ok <- insert_milestone_join(repo, comment.parent_type, entity_id, copied.id) do
      {:cont, {:ok, [copied | inserted]}}
    else
      {:error, reason} -> {:halt, {:error, reason}}
    end
  end

  defp insert_comment(repo, attrs) do
    case repo.insert(RuntimeComment.changeset(attrs)) do
      {:ok, comment} -> {:ok, comment}
      {:error, changeset} -> {:error, {:invalid_child, :comment, changeset}}
    end
  end

  defp insert_milestone_join(_repo, parent_type, _milestone_id, _comment_id) when parent_type != :milestone, do: :ok

  defp insert_milestone_join(repo, :milestone, milestone_id, comment_id) do
    case repo.insert(MilestoneComment.changeset(%{milestone_id: milestone_id, comment_id: comment_id, action: :none})) do
      {:ok, _join} -> :ok
      {:error, changeset} -> {:error, {:invalid_child, :comment, changeset}}
    end
  end

  defp active_author_id(author, company_id, creator_id) do
    if Discussion.author_active?(author, company_id), do: author && author.id, else: creator_id
  end
end
