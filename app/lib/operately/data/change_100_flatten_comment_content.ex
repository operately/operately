defmodule Operately.Data.Change100FlattenCommentContent do
  import Ecto.Query, only: [from: 1]

  alias Ecto.Changeset
  alias Operately.Repo
  alias __MODULE__.Comment

  def run do
    Repo.transaction(fn ->
      Repo.stream(from c in Comment)
      |> Enum.each(&maybe_update_comment/1)
    end)
  end

  def flatten_content(%{"message" => content}), do: content || %{}
  def flatten_content(%{message: content}), do: content || %{}
  def flatten_content(content), do: content

  defp maybe_update_comment(comment) do
    content = flatten_content(comment.content)

    if content != comment.content do
      comment
      |> Changeset.change(%{content: content})
      |> Repo.update!()
    end
  end

  defmodule Comment do
    use Operately.Schema

    schema "comments" do
      field :content, :map
    end
  end
end
