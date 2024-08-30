defmodule Operately.RichContentTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
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
end
