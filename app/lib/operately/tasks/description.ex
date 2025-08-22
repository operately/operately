defmodule Operately.Tasks.Description do
  alias Operately.Tasks.Task

  @doc """
  Determines if a task or description has meaningful content.

  Returns `true` if the task has a non-empty description, `false` otherwise.
  Handles TipTap editor format, empty maps, and nil values.

  ## Examples

      iex> Operately.Tasks.Description.has_description?(%Task{description: nil})
      false

      iex> Operately.Tasks.Description.has_description?(%Task{description: %{}})
      false

      iex> Operately.Tasks.Description.has_description?(%{"content" => [%{"type" => "paragraph"}], "type" => "doc"})
      false

      iex> Operately.Tasks.Description.has_description?(%{"content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Hello"}]}], "type" => "doc"})
      true
  """
  def has_description?(task = %Task{}) do
    has_description?(task.description)
  end

  def has_description?(description) do
    case description do
      nil -> false

      description when description == %{} -> false

      %{"type" => "doc", "content" => content} when is_list(content) ->
        # Convert TipTap content to string and check if it's meaningful
        content
        |> rich_content_to_string()
        |> String.trim()
        |> case do
          "" -> false
          _non_empty -> true
        end

      _ -> false
    end
  end

  @doc """
  Converts TipTap rich content to a plain string, similar to the JavaScript richContentToString function.
  """
  def rich_content_to_string(content) when is_list(content) do
    content
    |> Enum.map(&rich_content_to_string/1)
    |> Enum.join(" ")
  end

  def rich_content_to_string(%{"type" => "text", "text" => text}) when is_binary(text) do
    text
  end

  def rich_content_to_string(%{"type" => "mention", "attrs" => %{"label" => label}}) when is_binary(label) do
    label
  end

  def rich_content_to_string(%{"content" => content}) when is_list(content) do
    rich_content_to_string(content)
  end

  def rich_content_to_string(_), do: ""
end
