defmodule Operately.ProjectTemplates.Comments.Duplication do
  alias Operately.ProjectTemplates.Comment

  def run(repo, comments, template, parent_ids) do
    Enum.reduce_while(comments, {:ok, []}, fn source, {:ok, copied} ->
      with {:ok, parent_id} <- remapped_parent_id(source, parent_ids),
           {:ok, comment} <- insert_comment(repo, source, template.id, parent_id) do
        {:cont, {:ok, [comment | copied]}}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> then(fn
      {:ok, copied} -> {:ok, Enum.reverse(copied)}
      error -> error
    end)
  end

  defp remapped_parent_id(comment, parent_ids) do
    case get_in(parent_ids, [comment.parent_type, comment.parent_id]) do
      nil -> {:error, {:invalid_template, :foreign_comment_parent}}
      parent_id -> {:ok, parent_id}
    end
  end

  defp insert_comment(repo, source, template_id, parent_id) do
    attrs = %{
      project_template_id: template_id,
      author_id: source.author_id,
      parent_type: source.parent_type,
      parent_id: parent_id,
      content: source.content,
      position: source.position
    }

    case repo.insert(Comment.changeset(attrs)) do
      {:ok, comment} -> {:ok, comment}
      {:error, changeset} -> {:error, {:invalid_child, :comment, changeset}}
    end
  end
end
