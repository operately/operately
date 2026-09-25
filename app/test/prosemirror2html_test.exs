defmodule Prosemirror2HtmlTest do
  use ExUnit.Case

  @opts struct!(Prosemirror2Html.Options, domain: "https://example.com")

  @table_fixtures "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!()

  for fixture <- @table_fixtures do
    @fixture fixture
    test "renders semantic email tables: #{fixture["name"]}" do
      html = Prosemirror2Html.convert(@fixture["document"], @opts)
      dom = Floki.parse_document!(html)
      table = Enum.at(@fixture["document"]["content"], 1)
      header? = hd(hd(table["content"])["content"])["type"] == "tableHeader"

      assert length(Floki.find(dom, "table tr")) == length(table["content"])
      expected_headers = if header?, do: 2, else: 0
      assert length(Floki.find(dom, "table tr:first-child th")) == expected_headers
      assert length(Floki.find(dom, "table th, table td")) == length(table["content"]) * 2
      assert html =~ "border-collapse: collapse"
      assert html =~ "padding: 8px"
      assert html =~ "Before"
      assert html =~ "After"
      if @fixture["name"] == "attachments in cells" do
        assert Floki.attribute(dom, "td a", "href") == ["https://example.com/files/report (final).pdf", "https://example.com/files/diagram.png"]
        assert Floki.find(dom, "td p div") == []
      end
      if @fixture["name"] == "pipes backslashes and breaks" do
        assert html =~ "one<br>two"
        assert html =~ "a<br>b"
      end
    end
  end

  test "escapes table text and link attributes without turning them into HTML" do
    paragraph = %{"type" => "paragraph", "content" => [
      %{"type" => "text", "text" => "<img src=x onerror=alert(1)> &", "marks" => [%{"type" => "bold"}]},
      %{"type" => "text", "text" => "Link", "marks" => [%{"type" => "link", "attrs" => %{"href" => "https://example.com/?q=\" onclick=\"evil&ok=1"}}]},
      %{"type" => "mention", "attrs" => %{"id" => "alice", "label" => "<Alice> Smith"}}
    ]}
    cell = %{"type" => "tableCell", "content" => [paragraph]}
    row = %{"type" => "tableRow", "content" => [cell]}
    content = %{"type" => "doc", "content" => [%{"type" => "table", "content" => [row]}]}

    dom = content |> Prosemirror2Html.convert(@opts) |> Floki.parse_document!()
    assert Floki.find(dom, "img, [onclick], [onerror]") == []
    assert Floki.text(Floki.find(dom, "td")) =~ "<img src=x onerror=alert(1)> &"
    assert Floki.attribute(dom, "a", "href") == ["https://example.com/?q=\" onclick=\"evil&ok=1"]
    assert Floki.text(Floki.find(dom, "td")) =~ "<Alice> Smith"
  end

  test "does not render executable link schemes" do
    for href <- ["javascript:alert(1)", "java\nscript:alert(1)", "data:text/html,<script>alert(1)</script>"] do
      assert Prosemirror2Html.convert_mark("Link", %{"type" => "link", "attrs" => %{"href" => href}}, @opts) == "Link"
    end
  end

  test "preserves valid merged cell spans and ignores invalid span attributes" do
    for type <- ["tableCell", "tableHeader"] do
      cell = %{"type" => type, "attrs" => %{"colspan" => 2, "rowspan" => 3}, "content" => [%{"type" => "paragraph"}]}
      dom = cell |> Prosemirror2Html.convert_node(@opts) |> Floki.parse_fragment!()
      assert Floki.attribute(dom, "td, th", "colspan") == ["2"]
      assert Floki.attribute(dom, "td, th", "rowspan") == ["3"]

      for invalid <- [nil, 0, -1, "2", "2 onclick=alert(1)"] do
        cell = Map.put(cell, "attrs", %{"colspan" => invalid, "rowspan" => invalid})
        dom = cell |> Prosemirror2Html.convert_node(@opts) |> Floki.parse_fragment!()
        assert Floki.attribute(dom, "td, th", "colspan") == []
        assert Floki.attribute(dom, "td, th", "rowspan") == []
      end
    end
  end

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
    html = Prosemirror2Html.convert(@fullExample, @opts)

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
      "<strong>Michael</strong>",
      "</p>",
      "<p>Quote:</p><blockquote><p>Hello World</p></blockquote>",
      "<p></p>",
      "<p>Link: <a href=\"github.com/operately/operately\">Repository</a></p>",
      "<ul><li><p>List 1</p></li><li><p>List 2</p></li></ul>",
      "<hr>"
    ])
  end

  test "mulitple nodes" do
    content = %{
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
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<p>Hello</p><p>Hello</p>"
  end

  test "paragraph" do
    content = %{
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
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<p>Hello</p>"
  end

  test "bold mark" do
    content = %{
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
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<strong>Hello</strong>"
  end

  test "multiple marks" do
    content = %{
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
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<strong><em>Hello</em></strong>"
  end

  test "blobs" do

    content = %{
      "type" => "doc", 
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
             "alt" => "Authentication Failed message", 
             "filesize" => 91747, 
             "filetype" => "image/png", 
             "id" => "loegrjli3g3bgeqlxm8", 
             "progress" => 100, 
             "src" => "/blobs/9d278e9b-b2a9-46bb-abcc-f2e190b46ff5", 
             "status" => "uploaded", 
             "title" => "Authentication Failed message"
          }
        }
      ]
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<div>&#128206; <a href=\"https://example.com/blobs/9d278e9b-b2a9-46bb-abcc-f2e190b46ff5\">Authentication Failed message</a></div>"
  end

  test "ordered list with start other than 1" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "orderedList",
          "attrs" => %{"start" => 6, "type" => nil},
          "content" => [
            %{
              "type" => "listItem",
              "content" => [
                %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Sixth"}]}
              ]
            }
          ]
        }
      ]
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<ol start=\"6\"><li><p>Sixth</p></li></ol>"
  end

  test "underline mark" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "text",
          "text" => "Hello",
          "marks" => [%{"type" => "underline"}]
        }
      ]
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "<u>Hello</u>"
  end

  test "unknown node keeps inner text" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "unknownCustomNode",
          "content" => [%{"type" => "text", "text" => "Survives"}]
        }
      ]
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "Survives"
  end

  test "unknown mark keeps plain text" do
    content = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "text",
          "text" => "Hello",
          "marks" => [%{"type" => "unknownMark"}]
        }
      ]
    }

    html = Prosemirror2Html.convert(content, @opts)
    assert html == "Hello"
  end
end
