defmodule Operately.MD.RichTextTest do
  use ExUnit.Case, async: true

  alias Operately.MD.RichText

  describe "render/1" do
    test "renders an empty document" do
      doc = %{"type" => "doc", "content" => []}
      assert RichText.render(doc) == ""
    end

    test "renders invalid input as empty string" do
      assert RichText.render(nil) == ""
      assert RichText.render("invalid") == ""
      assert RichText.render(%{}) == ""
      assert RichText.render(%{"type" => "doc"}) == ""
      assert RichText.render(%{"content" => []}) == ""
    end
  end

  describe "paragraphs" do
    test "renders a simple paragraph" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "Hello world"}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "Hello world"
    end

    test "renders multiple paragraphs with double line breaks" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [%{"type" => "text", "text" => "First paragraph"}]
          },
          %{
            "type" => "paragraph",
            "content" => [%{"type" => "text", "text" => "Second paragraph"}]
          }
        ]
      }

      assert RichText.render(doc) == "First paragraph\n\nSecond paragraph"
    end

    test "renders empty paragraph" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{"type" => "paragraph", "content" => []}
        ]
      }

      assert RichText.render(doc) == ""
    end
  end

  describe "headings" do
    test "renders heading level 1" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "heading",
            "attrs" => %{"level" => 1},
            "content" => [%{"type" => "text", "text" => "Main Title"}]
          }
        ]
      }

      assert RichText.render(doc) == "# Main Title"
    end

    test "renders heading level 2" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "heading",
            "attrs" => %{"level" => 2},
            "content" => [%{"type" => "text", "text" => "Subtitle"}]
          }
        ]
      }

      assert RichText.render(doc) == "## Subtitle"
    end

    test "renders heading level 6" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "heading",
            "attrs" => %{"level" => 6},
            "content" => [%{"type" => "text", "text" => "Small heading"}]
          }
        ]
      }

      assert RichText.render(doc) == "###### Small heading"
    end

    test "renders heading with inline formatting" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "heading",
            "attrs" => %{"level" => 2},
            "content" => [
              %{"type" => "text", "text" => "Bold", "marks" => [%{"type" => "bold"}]},
              %{"type" => "text", "text" => " Title"}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "## **Bold** Title"
    end
  end

  describe "blockquotes" do
    test "renders simple blockquote" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blockquote",
            "content" => [
              %{
                "type" => "paragraph",
                "content" => [%{"type" => "text", "text" => "This is a quote"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "> This is a quote"
    end

    test "renders multiline blockquote" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blockquote",
            "content" => [
              %{
                "type" => "paragraph",
                "content" => [%{"type" => "text", "text" => "First line"}]
              },
              %{
                "type" => "paragraph",
                "content" => [%{"type" => "text", "text" => "Second line"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "> First line\n> Second line"
    end

    test "renders nested blockquote content with line breaks" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blockquote",
            "content" => [
              %{
                "type" => "paragraph",
                "content" => [%{"type" => "text", "text" => "Multi\nline\ntext"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "> Multi\n> line\n> text"
    end
  end

  describe "code blocks" do
    test "renders code block without language" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "codeBlock",
            "attrs" => %{},
            "content" => [%{"type" => "text", "text" => "console.log('hello');"}]
          }
        ]
      }

      assert RichText.render(doc) == "```\nconsole.log('hello');\n```"
    end

    test "renders code block with language" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "codeBlock",
            "attrs" => %{"language" => "javascript"},
            "content" => [%{"type" => "text", "text" => "console.log('hello');"}]
          }
        ]
      }

      assert RichText.render(doc) == "```javascript\nconsole.log('hello');\n```"
    end

    test "renders multiline code block" do
      code = "def hello\n  puts 'world'\nend"

      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "codeBlock",
            "attrs" => %{"language" => "ruby"},
            "content" => [%{"type" => "text", "text" => code}]
          }
        ]
      }

      assert RichText.render(doc) == "```ruby\n#{code}\n```"
    end
  end

  describe "horizontal rule" do
    test "renders horizontal rule" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{"type" => "horizontalRule"}
        ]
      }

      assert RichText.render(doc) == "---"
    end
  end

  describe "lists" do
    test "renders simple bullet list" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "bulletList",
            "content" => [
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "First item"}]
              },
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "Second item"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "* First item\n* Second item"
    end

    test "renders simple ordered list" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "orderedList",
            "content" => [
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "First item"}]
              },
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "Second item"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "1. First item\n2. Second item"
    end

    test "renders ordered list with custom start" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "orderedList",
            "attrs" => %{"start" => 5},
            "content" => [
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "Fifth item"}]
              },
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "Sixth item"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "5. Fifth item\n6. Sixth item"
    end

    test "renders empty list items" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "bulletList",
            "content" => [
              %{"type" => "listItem", "content" => []},
              %{"type" => "listItem", "content" => [%{"type" => "text", "text" => "Non-empty"}]}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "* \n* Non-empty"
    end

    test "renders bullet list where each item is a paragraph node" do
      doc = %{
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
                    "content" => [
                      %{"type" => "text", "text" => "Paragraph item one"}
                    ]
                  }
                ]
              },
              %{
                "type" => "listItem",
                "content" => [
                  %{
                    "type" => "paragraph",
                    "content" => [
                      %{"type" => "text", "text" => "Paragraph item two"}
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "* Paragraph item one\n* Paragraph item two"
    end
  end

  describe "text formatting" do
    test "renders bold text" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "bold text",
                "marks" => [%{"type" => "bold"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "**bold text**"
    end

    test "renders italic text" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "italic text",
                "marks" => [%{"type" => "italic"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "_italic text_"
    end

    test "renders strikethrough text" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "strikethrough text",
                "marks" => [%{"type" => "strike"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "~~strikethrough text~~"
    end

    test "renders inline code" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "console.log",
                "marks" => [%{"type" => "code"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "`console.log`"
    end

    test "renders combined formatting" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "bold italic",
                "marks" => [%{"type" => "bold"}, %{"type" => "italic"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "_**bold italic**_"
    end

    test "renders link" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "Click here",
                "marks" => [%{"type" => "link", "attrs" => %{"href" => "https://example.com"}}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "[Click here](https://example.com)"
    end

    test "renders link with title" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "Click here",
                "marks" => [
                  %{
                    "type" => "link",
                    "attrs" => %{"href" => "https://example.com", "title" => "Example Site"}
                  }
                ]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "[Click here](https://example.com \"Example Site\")"
    end

    test "renders highlight" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "highlighted text",
                "marks" => [%{"type" => "highlight", "attrs" => %{"highlight" => "yellow"}}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "<!-- highlight: yellow -->highlighted text<!-- /highlight -->"
    end

    test "ignores highlight with nil value" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "text",
                "marks" => [%{"type" => "highlight", "attrs" => %{"highlight" => nil}}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "text"
    end

    test "renders text without marks" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "plain text"}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "plain text"
    end

    test "ignores unknown marks" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{
                "type" => "text",
                "text" => "text with unknown mark",
                "marks" => [%{"type" => "unknown"}]
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "text with unknown mark"
    end
  end

  describe "blobs and mentions" do
    test "renders image blob" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Example image",
              "src" => "/path/to/image.jpg",
              "filetype" => "image/jpeg"
            }
          }
        ]
      }

      assert RichText.render(doc) == "![Example image](/path/to/image.jpg)"
    end

    test "renders image blob with title" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Example image",
              "src" => "/path/to/image.jpg",
              "title" => "A beautiful image",
              "filetype" => "image/jpeg"
            }
          }
        ]
      }

      assert RichText.render(doc) == "![Example image](/path/to/image.jpg \"A beautiful image\")"
    end

    test "renders non-image blob as link" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Document",
              "src" => "/path/to/document.pdf",
              "filetype" => "application/pdf"
            }
          }
        ]
      }

      assert RichText.render(doc) == "[Document](/path/to/document.pdf)"
    end

    test "renders non-image blob with title as link" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Document",
              "src" => "/path/to/document.pdf",
              "title" => "Important PDF",
              "filetype" => "application/pdf"
            }
          }
        ]
      }

      assert RichText.render(doc) == "[Document](/path/to/document.pdf \"Important PDF\")"
    end

    test "renders blob without filetype as image" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Default image",
              "src" => "/path/to/file"
            }
          }
        ]
      }

      assert RichText.render(doc) == "![Default image](/path/to/file)"
    end

    test "renders blob with empty filetype as image" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "blob",
            "attrs" => %{
              "alt" => "Default image",
              "src" => "/path/to/file",
              "filetype" => ""
            }
          }
        ]
      }

      assert RichText.render(doc) == "![Default image](/path/to/file)"
    end

    test "renders mention as block" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "mention",
            "attrs" => %{"label" => "john.doe"}
          }
        ]
      }

      assert RichText.render(doc) == "@john.doe"
    end

    test "renders inline mention" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "Hello "},
              %{"type" => "mention", "attrs" => %{"label" => "jane.doe"}},
              %{"type" => "text", "text" => "!"}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "Hello @jane.doe!"
    end

    test "renders inline blob" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "Check out this image: "},
              %{
                "type" => "blob",
                "attrs" => %{
                  "alt" => "Inline image",
                  "src" => "/image.jpg",
                  "filetype" => "image/jpeg"
                }
              }
            ]
          }
        ]
      }

      assert RichText.render(doc) == "Check out this image: ![Inline image](/image.jpg)"
    end
  end

  describe "special nodes" do
    test "renders hard break" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{"type" => "hardBreak"}
        ]
      }

      assert RichText.render(doc) == "  \n"
    end

    test "renders text node as block" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{"type" => "text", "text" => "Direct text block"}
        ]
      }

      assert RichText.render(doc) == "Direct text block"
    end

    test "renders list item as block" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "listItem",
            "content" => [%{"type" => "text", "text" => "Standalone list item"}]
          }
        ]
      }

      assert RichText.render(doc) == "Standalone list item"
    end

    test "ignores unknown block types" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{"type" => "unknown", "content" => [%{"type" => "text", "text" => "content"}]}
        ]
      }

      assert RichText.render(doc) == ""
    end

    test "ignores unknown inline types" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "Valid text "},
              %{"type" => "unknown"},
              %{"type" => "text", "text" => " more text"}
            ]
          }
        ]
      }

      assert RichText.render(doc) == "Valid text  more text"
    end
  end

  describe "complex documents" do
    test "renders complex document with mixed content" do
      doc = %{
        "type" => "doc",
        "content" => [
          %{
            "type" => "heading",
            "attrs" => %{"level" => 1},
            "content" => [%{"type" => "text", "text" => "Main Title"}]
          },
          %{
            "type" => "paragraph",
            "content" => [
              %{"type" => "text", "text" => "This is a "},
              %{"type" => "text", "text" => "bold", "marks" => [%{"type" => "bold"}]},
              %{"type" => "text", "text" => " paragraph with a "},
              %{
                "type" => "text",
                "text" => "link",
                "marks" => [%{"type" => "link", "attrs" => %{"href" => "https://example.com"}}]
              },
              %{"type" => "text", "text" => "."}
            ]
          },
          %{
            "type" => "bulletList",
            "content" => [
              %{
                "type" => "listItem",
                "content" => [%{"type" => "text", "text" => "First item"}]
              },
              %{
                "type" => "listItem",
                "content" => [
                  %{"type" => "text", "text" => "Second item with "},
                  %{"type" => "text", "text" => "code", "marks" => [%{"type" => "code"}]}
                ]
              }
            ]
          },
          %{
            "type" => "codeBlock",
            "attrs" => %{"language" => "elixir"},
            "content" => [%{"type" => "text", "text" => "def hello, do: :world"}]
          }
        ]
      }

      expected = "# Main Title\n\nThis is a **bold** paragraph with a [link](https://example.com).\n\n* First item\n* Second item with `code`\n\n```elixir\ndef hello, do: :world\n```"

      assert RichText.render(doc) == expected
    end
  end
end
