defmodule Operately.ProjectTemplates.Comments.Materialization do
  alias Operately.ProjectTemplates.Discussion
  alias Operately.Updates.Comment, as: RuntimeComment

  @runtime_types %{
    discussion: :comment_thread,
    document: :resource_hub_document,
    file: :resource_hub_file,
    link: :resource_hub_link
  }

  def run(repo, comments, parent_ids, company_id, creator_id) do
    comments
    |> Enum.sort_by(&{&1.parent_type, &1.parent_id, &1.position, &1.id})
    |> Enum.reduce_while({:ok, []}, fn comment, {:ok, inserted} ->
      entity_id = get_in(parent_ids, [comment.parent_type, comment.parent_id])
      entity_type = Map.get(@runtime_types, comment.parent_type)

      if is_nil(entity_id) or is_nil(entity_type) do
        {:cont, {:ok, inserted}}
      else
        copy_comment(repo, comment, entity_id, entity_type, company_id, creator_id, inserted)
      end
    end)
  end

  defp copy_comment(repo, comment, entity_id, entity_type, company_id, creator_id, inserted) do
    attrs = %{
      id: Ecto.UUID.generate(),
      author_id: active_author_id(comment.author, company_id, creator_id),
      entity_id: entity_id,
      entity_type: entity_type,
      content: comment.content
    }

    case insert_comment(repo, attrs) do
      {:ok, copied} -> {:cont, {:ok, [copied | inserted]}}
      {:error, reason} -> {:halt, {:error, reason}}
    end
  end

  defp insert_comment(repo, attrs) do
    case repo.insert(RuntimeComment.changeset(attrs)) do
      {:ok, comment} -> {:ok, comment}
      {:error, changeset} -> {:error, {:invalid_child, :comment, changeset}}
    end
  end

  defp active_author_id(author, company_id, creator_id) do
    if Discussion.author_active?(author, company_id), do: author && author.id, else: creator_id
  end
end
