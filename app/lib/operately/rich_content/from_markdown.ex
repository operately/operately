defmodule Operately.RichContent.FromMarkdown do
  @moduledoc """
  Converts plain text or simple markdown into Operately rich content (ProseMirror JSON).

  Supports headings, paragraphs, bullet and numbered lists, bold text, and optional
  `@mentions` when a `:mention_resolver` option is provided.

  ## Options

    * `:mention_resolver` - `(String.t() -> map() | nil)`. Called with the mention
      label without the leading `@`. When it returns `%{id: id, label: label}`, a
      mention node is emitted; otherwise the `@label` text is kept as plain text.
  """

  @type mention_resolver :: (String.t() -> map() | nil)

  def to_rich_text(content, opts \\ [])

  def to_rich_text(content, opts) when is_binary(content) do
    if String.trim(content) == "" do
      {:error, :invalid_arguments}
    else
      {:ok, parse(content, opts)}
    end
  end

  def to_rich_text(_content, _opts), do: {:error, :invalid_arguments}

  defp parse(content, opts) do
    content
    |> String.split("\n\n", trim: true)
    |> Enum.reduce([], &parse_block(&1, &2, opts))
    |> build_document()
  end

  defp build_document(content) do
    %{
      "type" => "doc",
      "content" => content
    }
  end

  defp parse_block(block, acc, opts) do
    cond do
      String.starts_with?(block, "- ") ->
        acc ++ parse_bullet_list(block, opts)

      String.starts_with?(block, "1. ") ->
        acc ++ parse_numbered_list(block, opts)

      String.match?(block, ~r/^#+\s/) ->
        if String.contains?(block, "\n") do
          [heading, rest] = String.split(block, "\n", parts: 2)
          acc ++ parse_heading(heading) ++ parse_block(rest, [], opts)
        else
          acc ++ parse_heading(block)
        end

      true ->
        acc ++ parse_paragraph(block, opts)
    end
  end

  defp parse_heading(heading) do
    [_full, hashes, text] = Regex.run(~r/^(#+)\s(.+)/, heading)

    [
      %{
        "type" => "heading",
        "content" => [%{"type" => "text", "text" => text}],
        "attrs" => %{"level" => String.length(hashes)}
      }
    ]
  end

  defp parse_paragraph(block, opts) do
    [
      %{
        "type" => "paragraph",
        "content" => parse_inline(block, opts)
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_bullet_list(block, opts) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(fn item ->
        %{
          "type" => "listItem",
          "content" => [
            %{
              "type" => "paragraph",
              "content" => parse_inline(String.trim_leading(item, "- "), opts)
            }
          ]
        }
      end)

    [
      %{"type" => "bulletList", "content" => items},
      %{"type" => "paragraph"}
    ]
  end

  defp parse_numbered_list(block, opts) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(fn item ->
        cleaned = String.replace(item, ~r/^\d+\./, "") |> String.trim()

        %{
          "type" => "listItem",
          "content" => [
            %{
              "type" => "paragraph",
              "content" => parse_inline(cleaned, opts)
            }
          ]
        }
      end)

    [
      %{
        "type" => "orderedList",
        "content" => items,
        "attrs" => %{"start" => 1}
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_inline(text, opts) do
    text
    |> String.split(~r/(\*\*.*?\*\*|@\w+)/, include_captures: true, trim: true)
    |> Enum.map(&build_inline_node(&1, opts))
  end

  defp build_inline_node(text, opts) do
    cond do
      String.starts_with?(text, "**") and String.ends_with?(text, "**") ->
        %{
          "type" => "text",
          "text" => String.trim(text, "**"),
          "marks" => [%{"type" => "bold"}]
        }

      String.starts_with?(text, "@") ->
        build_mention_node(text, opts)

      true ->
        %{"type" => "text", "text" => text}
    end
  end

  defp build_mention_node(text, opts) do
    label = String.trim_leading(text, "@")

    case Keyword.get(opts, :mention_resolver) do
      resolver when is_function(resolver, 1) ->
        case resolver.(label) do
          %{id: id, label: mention_label} ->
            %{
              "type" => "mention",
              "attrs" => %{
                "id" => id,
                "label" => mention_label
              }
            }

          _ ->
            %{"type" => "text", "text" => text}
        end

      _ ->
        %{"type" => "text", "text" => text}
    end
  end
end
