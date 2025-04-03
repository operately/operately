defmodule Operately.Demo.Comments do
  alias Operately.Repo
  alias Operately.Demo.{PoorMansMarkdown, Resources}

  alias Operately.Updates.Comment
  alias Operately.Messages.Message
  alias Operately.ResourceHubs.Document

  def create_comments(_, _, nil), do: :ok

  def create_comments(resources, parent, comments) do
    comments
    |> Enum.with_index()
    |> Enum.map(fn {comment, index} -> create_comment(resources, parent, comment, index) end)
  end

  defp create_comment(resources, parent, data, index) do
    author = Resources.get(resources, data.author)
    parent = preload(parent)
    parent_type = find_parent_type(parent)
    content = PoorMansMarkdown.from_markdown(data.content, resources)

    {:ok, comment} = Operately.Operations.CommentAdding.run(author, parent, parent_type, content)

    update_comment_inserted_at(comment, index)
  end

  defp preload(message = %Message{}), do: Repo.preload(message, :space)
  defp preload(document = %Document{}), do: Repo.preload(document, [:resource_hub, :node])

  defp find_parent_type(%Message{}), do: "message"
  defp find_parent_type(%Document{}), do: "resource_hub_document"

  # if every comment is inserted at the same time, they will have the same inserted_at value
  # and the sorting will not have a well defined order

  defp update_comment_inserted_at(comment, index) do
    comment
    |> Comment.changeset(%{inserted_at: NaiveDateTime.add(comment.inserted_at, index, :second)})
    |> Repo.update()
  end
end
