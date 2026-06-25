defmodule Operately.RichContent.FromMarkdownTest do
  use ExUnit.Case, async: true

  alias Operately.RichContent.FromMarkdown

  describe "to_rich_text/2" do
    test "returns error for blank content" do
      assert FromMarkdown.to_rich_text("") == {:error, :invalid_arguments}
      assert FromMarkdown.to_rich_text("   ") == {:error, :invalid_arguments}
    end

    test "returns error for non-binary content" do
      assert FromMarkdown.to_rich_text(nil) == {:error, :invalid_arguments}
      assert FromMarkdown.to_rich_text(%{}) == {:error, :invalid_arguments}
    end

    test "parses a paragraph" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("Hello world")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "paragraph",
                   "content" => [%{"type" => "text", "text" => "Hello world"}]
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end

    test "parses bold text" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("This is **bold** text")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "paragraph",
                   "content" => [
                     %{"type" => "text", "text" => "This is "},
                     %{"type" => "text", "text" => "bold", "marks" => [%{"type" => "bold"}]},
                     %{"type" => "text", "text" => " text"}
                   ]
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end

    test "parses headings" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("# Title")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "heading",
                   "content" => [%{"type" => "text", "text" => "Title"}],
                   "attrs" => %{"level" => 1}
                 }
               ]
             }
    end

    test "parses bullet lists" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("- One\n- Two")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "bulletList",
                   "content" => [
                     %{
                       "type" => "listItem",
                       "content" => [
                         %{
                           "type" => "paragraph",
                           "content" => [%{"type" => "text", "text" => "One"}]
                         }
                       ]
                     },
                     %{
                       "type" => "listItem",
                       "content" => [
                         %{
                           "type" => "paragraph",
                           "content" => [%{"type" => "text", "text" => "Two"}]
                         }
                       ]
                     }
                   ]
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end

    test "parses numbered lists" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("1. First\n2. Second")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "orderedList",
                   "content" => [
                     %{
                       "type" => "listItem",
                       "content" => [
                         %{
                           "type" => "paragraph",
                           "content" => [%{"type" => "text", "text" => "First"}]
                         }
                       ]
                     },
                     %{
                       "type" => "listItem",
                       "content" => [
                         %{
                           "type" => "paragraph",
                           "content" => [%{"type" => "text", "text" => "Second"}]
                         }
                       ]
                     }
                   ],
                   "attrs" => %{"start" => 1}
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end

    test "keeps unresolved mentions as plain text" do
      assert {:ok, doc} = FromMarkdown.to_rich_text("Ping @alice")

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "paragraph",
                   "content" => [
                     %{"type" => "text", "text" => "Ping "},
                     %{"type" => "text", "text" => "@alice"}
                   ]
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end

    test "resolves mentions with a mention resolver" do
      resolver = fn "alice" -> %{id: "person-1", label: "Alice Johnson"} end

      assert {:ok, doc} = FromMarkdown.to_rich_text("Ping @alice", mention_resolver: resolver)

      assert doc == %{
               "type" => "doc",
               "content" => [
                 %{
                   "type" => "paragraph",
                   "content" => [
                     %{"type" => "text", "text" => "Ping "},
                     %{
                       "type" => "mention",
                       "attrs" => %{"id" => "person-1", "label" => "Alice Johnson"}
                     }
                   ]
                 },
                 %{"type" => "paragraph"}
               ]
             }
    end
  end
end
