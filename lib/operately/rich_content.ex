defmodule Operately.RichContent do
  @moduledoc """
  RichContent are the content of a messages, comments, etc, where the
  text is formatted as a ProseMirror JSON document.
  """

  def lookup_mentioned_people(document) do
    document
    |> find_mentioned_ids()
    |> Enum.map(fn id -> find_persons_by_id(id) end)
    |> Enum.filter(fn person -> person != nil end)
  end

  def find_persons_by_id(id) do
    with {:ok, id} <- OperatelyWeb.Api.Helpers.decode_id(id) do
      Operately.People.get_person(id)
    else
      _ -> nil
    end
  end

  def find_mentioned_ids(document) do
    extract_mentions_from_node(document) |> Enum.uniq()
  end

  def find_mentioned_ids(document, :decode_ids) do
    {:ok, ids} =
      document
      |> find_mentioned_ids()
      |> Enum.uniq()
      |> OperatelyWeb.Api.Helpers.decode_id()

    ids
  end

  def extract_mentions_from_node(%{"type" => "mention", "attrs" => %{"id" => id}}) do
    [id]
  end

  def extract_mentions_from_node(%{"content" => content}) do
    content |> Enum.flat_map(fn node -> extract_mentions_from_node(node) end)
  end

  def extract_mentions_from_node(_), do: []


  defmodule DSL do
    defmacro doc(do: block) do
      content = __collect__(block)

      quote do
        cleared = Enum.filter(unquote(content), fn x -> x != nil end)

        full = Enum.reduce(cleared, [], fn x, acc -> 
          if x[:type] == "injected" do
            acc ++ x[:content]
          else
            acc ++ [x]
          end
        end)

        doc = %{type: "doc", content: full}
        doc |> Jason.encode!() |> Jason.decode!()
      end
    end

    defp __collect__({:__block__, _, exprs}), do: Enum.map(exprs, & &1)
    defp __collect__({:inject, content}), do: content
    defp __collect__(expr), do: [expr]

    def inject(content) do
      %{type: "injected", content: content["content"]}
    end

    def h1(content) when is_binary(content) do
      %{type: "heading", attrs: %{"level" => 1}, content: [text(content)]}
    end

    def h2(content) when is_binary(content) do
      %{type: "heading", attrs: %{"level" => 2}, content: [text(content)]}
    end

    def paragraph(content) when is_binary(content) do
      %{type: "paragraph", content: [text(content)]}
    end

    def text(text, marks \\ []) do
      %{type: "text", text: text, marks: marks}
    end

    def bold(text), do: %{type: "text", text: text, marks: [%{type: "bold"}]}
    def italic(text), do: %{type: "text", text: text, marks: [%{type: "italic"}]}
    def code(text), do: %{type: "text", text: text, marks: [%{type: "code"}]}

    def bg_gray(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgGray"}}]}
    def bg_green(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgGreen"}}]}
    def bg_yellow(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgYellow"}}]}
    def bg_red(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgRed"}}]}

    def link(text, url) do
      %{type: "text", text: text, marks: [%{type: "link", attrs: %{"href" => url}}]}
    end
  end
end
