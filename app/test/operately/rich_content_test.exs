defmodule Operately.RichContentTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.BlobsFixtures
  import Operately.PeopleFixtures
  
  alias OperatelyWeb.Paths

  setup do
    company = company_fixture(%{name: "Operately"})

    michael = person_fixture_with_account(%{full_name: "Michael Fassbender", company_id: company.id})
    john = person_fixture_with_account(%{full_name: "John Doe", company_id: company.id})

    document = %{
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
                "id" => Paths.person_id(michael),
                "label" => "Michael Fassbender"
              },
              "type" => "mention"
            },
            %{
              "attrs" => %{
                "id" => john.id,
                "label" => "John Doe"
              },
              "type" => "mention"
            },
            %{
              "attrs" => %{
                "id" => "some-broken-id",
                "label" => "Broken ID"
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

    ctx = %{
      company: company,
      michael: michael,
      john: john,
      document: document
    }

    {:ok, ctx}
  end

  test ".find_mentioned_ids/1 returns mentioned IDs", ctx do
    assert Operately.RichContent.find_mentioned_ids(ctx.document) == [
      Paths.person_id(ctx.michael),  # support for new web ID
      ctx.john.id,                   # support for old UUIDs
      "some-broken-id"               # also return broken IDs
    ]
  end

  test ".lookup_mentioned_people/1 returns mentioned people with valid IDs", ctx do
    people = Operately.RichContent.lookup_mentioned_people(ctx.document)

    assert Enum.find(people, & &1.id == ctx.michael.id)
    assert Enum.find(people, & &1.id == ctx.john.id)
  end

  test ".find_blob_ids/1 returns normalized blob ids from rich text", ctx do
    blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.michael.id})

    document = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
            "id" => Paths.blob_id(blob),
            "src" => Operately.Blobs.Blob.url(blob),
            "title" => blob.filename
          }
        }
      ]
    }

    assert Operately.RichContent.find_blob_ids(document) == [blob.id]
  end

  test ".find_blob_ids/1 supports legacy blob src maps", ctx do
    blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.michael.id})

    document = %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
            "src" => %{
              "id" => blob.id,
              "url" => Operately.Blobs.Blob.url(blob)
            },
            "title" => blob.filename
          }
        }
      ]
    }

    assert Operately.RichContent.find_blob_ids(document) == [blob.id]
  end

  describe ".tiptap_document?/1" do
    test "returns true for an empty TipTap document" do
      assert Operately.RichContent.tiptap_document?(%{"type" => "doc", "content" => []})
    end

    test "returns true for a TipTap document with paragraph content" do
      assert Operately.RichContent.tiptap_document?(%{
               "type" => "doc",
               "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "hello"}]}]
             })
    end

    test "returns false for arbitrary maps" do
      refute Operately.RichContent.tiptap_document?(%{})
    end

    test "returns false for maps whose root is not a doc" do
      refute Operately.RichContent.tiptap_document?(%{"type" => "paragraph", "content" => []})
    end

    test "returns false when content is not a list" do
      refute Operately.RichContent.tiptap_document?(%{"type" => "doc", "content" => %{}})
    end

    test "returns false for wrapper maps that contain a TipTap document" do
      refute Operately.RichContent.tiptap_document?(%{
               "message" => %{"type" => "doc", "content" => []}
             })
    end

    test "returns false for JSON strings" do
      refute Operately.RichContent.tiptap_document?(~s({"type":"doc","content":[]}))
    end
  end
end
