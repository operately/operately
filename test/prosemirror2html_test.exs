defmodule Prosemirror2HtmlTest do
  use ExUnit.Case

  @fullExample %{
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

  test "converts a a complex paragraph with various nodes and marks" do
    html = Prosemirror2Html.convert(@fullExample)
    assert html == Enum.join([
      "<p>",
      "<strong>Hello</strong>, ",
      "<em>Hello</em>, ",
      "<strong><em>Hello, </em></strong>",
      "<strong><em><strike>Hello</strike></em></strong>",
      "</p>",
      "<ol>",
      "<li><p>Example 1</p></li>",
      "<li><p>Example 2</p></li>",
      "<li><p>Example 3</p></li>",
      "</ol>",
      "<p>",
      "<strong>Michael Fassbender</strong>",
      "</p>",
      "<p>Quote:</p><blockquote><p>Hello World</p></blockquote>",
      "<p></p>",
      "<p>Link: <a href=\"github.com/operately/operately\">Repository</a></p>",
      "<ul><li><p>List 1</p></li><li><p>List 2</p></li></ul>",
      "<hr>"
    ])
  end

  test "mulitple nodes" do
    html = Prosemirror2Html.convert(%{
      "type" => "doc", 
      "content" => [
        %{
          "type" => "paragraph",
          "content" => [
            %{
              "type" => "text",
              "text" => "Hello"
            }
          ]
        },
        %{
          "type" => "paragraph",
          "content" => [
            %{
              "type" => "text",
              "text" => "Hello"
            }
          ]
        }
      ]
    })

    assert html == "<p>Hello</p><p>Hello</p>"
  end

  test "paragraph" do
    html = Prosemirror2Html.convert(%{
      "type" => "doc", 
      "content" => [
        %{
          "type" => "paragraph",
          "content" => [
            %{
              "type" => "text",
              "text" => "Hello"
            }
          ]
        }
      ]
    })

    assert html == "<p>Hello</p>"
  end

  test "bold mark" do
    html = Prosemirror2Html.convert(%{
      "type" => "doc", 
      "content" => [
        %{
          "type" => "text", 
          "text" => "Hello", 
          "marks" => [
            %{
              "type" => "bold"
            }
          ]
        }
      ]
    })

    assert html == "<strong>Hello</strong>"
  end

  test "multiple marks" do
    html = Prosemirror2Html.convert(%{
      "type" => "doc", 
      "content" => [
        %{
          "type" => "text", 
          "text" => "Hello", 
          "marks" => [
            %{
              "type" => "bold"
            },
            %{
              "type" => "italic"
            }
          ]
        }
      ]
    })

    assert html == "<strong><em>Hello</em></strong>"
  end

end
