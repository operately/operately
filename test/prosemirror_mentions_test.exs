defmodule ProsemirrorMentionsTest do
  use ExUnit.Case

  @full_example %{
    "type" => "doc",
    "content" => [
      %{
        "content" => [
          %{"marks" => [%{"type" => "bold"}], "text" => "Hello", "type" => "text"},
          %{"text" => ", ", "type" => "text"},
          %{
            "marks" => [%{"type" => "italic"}],
            "text" => "Hello",
            "type" => "text"
          },
          %{"text" => ", ", "type" => "text"},
          %{
            "marks" => [%{"type" => "bold"}, %{"type" => "italic"}],
            "text" => "Hello, ",
            "type" => "text"
          },
          %{
            "marks" => [
              %{"type" => "bold"},
              %{"type" => "italic"},
              %{"type" => "strike"}
            ],
            "text" => "Hello",
            "type" => "text"
          }
        ],
        "type" => "paragraph"
      },
      %{
        "attrs" => %{"start" => 1},
        "content" => [
          %{
            "content" => [
              %{
                "content" => [%{"text" => "Example 1", "type" => "text"}],
                "type" => "paragraph"
              }
            ],
            "type" => "listItem"
          },
          %{
            "content" => [
              %{
                "content" => [%{"text" => "Example 2", "type" => "text"}],
                "type" => "paragraph"
              }
            ],
            "type" => "listItem"
          },
          %{
            "content" => [
              %{
                "content" => [%{"text" => "Example 3", "type" => "text"}],
                "type" => "paragraph"
              }
            ],
            "type" => "listItem"
          }
        ],
        "type" => "orderedList"
      },
      %{
        "content" => [
          %{
            "attrs" => %{
              "id" => "c622551c-e3d2-4112-a48d-98ed70c8879b",
              "label" => "Michael Fassbender"
            },
            "type" => "mention"
          }
        ],
        "type" => "paragraph"
      },
      %{
        "content" => [%{"text" => "Quote:", "type" => "text"}],
        "type" => "paragraph"
      },
      %{
        "content" => [
          %{
            "content" => [%{"text" => "Hello World", "type" => "text"}],
            "type" => "paragraph"
          }
        ],
        "type" => "blockquote"
      },
      %{"type" => "paragraph"},
      %{
        "content" => [
          %{"text" => "Link: ", "type" => "text"},
          %{
            "marks" => [
              %{
                "attrs" => %{
                  "class" => nil,
                  "href" => "github.com/operately/operately",
                  "rel" => "noopener noreferrer nofollow",
                  "target" => "_blank"
                },
                "type" => "link"
              }
            ],
            "text" => "Repository",
            "type" => "text"
          }
        ],
        "type" => "paragraph"
      },
      %{
        "type" => "bulletList",
        "content" => [
          %{
            "content" => [
              %{
                "content" => [%{"text" => "List 1", "type" => "text"}],
                "type" => "paragraph"
              }
            ],
            "type" => "listItem"
          },
          %{
            "content" => [
              %{
                "content" => [%{"text" => "List 2", "type" => "text"}],
                "type" => "paragraph"
              }
            ],
            "type" => "listItem"
          }
        ]
      },
      %{"type" => "horizontalRule"}
    ]
  }

  test "extract_ids" do
    assert ProsemirrorMentions.extract_ids(@full_example) == ["c622551c-e3d2-4112-a48d-98ed70c8879b"]
  end
end
