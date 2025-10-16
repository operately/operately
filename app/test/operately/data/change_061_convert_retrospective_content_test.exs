defmodule Operately.Data.Change061ConvertRetrospectiveContentTest do
  use Operately.DataCase

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "converts old-format retrospectives to new format", ctx do
    old_format_content = %{
      "whatWentWell" => %{
        "type" => "doc",
        "content" => [
          %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Team collaboration was excellent"}]}
        ]
      },
      "whatDidYouLearn" => %{
        "type" => "doc",
        "content" => [
          %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Agile planning helped"}]}
        ]
      },
      "whatCouldHaveGoneBetter" => %{
        "type" => "doc",
        "content" => [
          %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Communication with stakeholders"}]}
        ]
      }
    }

    retrospective =
      Operately.ProjectsFixtures.retrospective_fixture(%{
        project_id: ctx.project.id,
        author_id: ctx.creator.id,
        content: old_format_content
      })

    Operately.Data.Change061ConvertRetrospectiveContent.run()

    updated_retrospective = Repo.reload(retrospective)

    # The content should now be a single document with headings
    assert updated_retrospective.content["type"] == "doc"
    assert updated_retrospective.content["content"] |> is_list()

    # Extract heading texts and paragraph content for verification
    content_items = updated_retrospective.content["content"]
    headings = Enum.filter(content_items, fn item -> item["type"] == "heading" end)

    heading_texts =
      Enum.map(headings, fn heading ->
        Enum.at(heading["content"], 0)["text"]
      end)

    # Check each heading exists
    assert Enum.member?(heading_texts, "What went well?")
    assert Enum.member?(heading_texts, "What could have gone better?")
    assert Enum.member?(heading_texts, "What did you learn?")

    # Check the content of the paragraphs
    paragraphs = Enum.filter(content_items, fn item -> item["type"] == "paragraph" end)

    paragraph_texts =
      Enum.map(paragraphs, fn paragraph ->
        case paragraph["content"] do
          [%{"text" => text} | _] -> text
          _ -> ""
        end
      end)
      |> Enum.filter(fn text -> text != "" end)

    # Verify the paragraph contents were preserved
    assert Enum.member?(paragraph_texts, "Team collaboration was excellent")
    assert Enum.member?(paragraph_texts, "Agile planning helped")
    assert Enum.member?(paragraph_texts, "Communication with stakeholders")
  end

  test "ignores retrospectives already in the new format", ctx do
    new_format_content = %{
      "type" => "doc",
      "content" => [
        %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "This is already in the new format"}]}
      ]
    }

    retrospective =
      Operately.ProjectsFixtures.retrospective_fixture(%{
        project_id: ctx.project.id,
        author_id: ctx.creator.id,
        content: new_format_content
      })

    original_content = retrospective.content

    Operately.Data.Change061ConvertRetrospectiveContent.run()

    updated_retrospective = Repo.reload(retrospective)
    assert updated_retrospective.content == original_content
  end

  test "handles empty or nil content sections gracefully", ctx do
    partial_content = %{
      "whatWentWell" => %{
        "type" => "doc",
        "content" => [
          %{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Good things happened"}]}
        ]
      },
      "whatDidYouLearn" => %{
        "type" => "doc",
        "content" => []
      },
      "whatCouldHaveGoneBetter" => nil
    }

    retrospective =
      Operately.ProjectsFixtures.retrospective_fixture(%{
        project_id: ctx.project.id,
        author_id: ctx.creator.id,
        content: partial_content
      })

    Operately.Data.Change061ConvertRetrospectiveContent.run()

    updated_retrospective = Repo.reload(retrospective)

    # The content should now be a single document
    assert updated_retrospective.content["type"] == "doc"
    assert updated_retrospective.content["content"] |> is_list()

    # Verify the content from the non-empty section was preserved
    content_items = updated_retrospective.content["content"]
    paragraphs = Enum.filter(content_items, fn item -> item["type"] == "paragraph" end)

    paragraph_texts =
      Enum.map(paragraphs, fn paragraph ->
        case paragraph["content"] do
          [%{"text" => text} | _] -> text
          _ -> ""
        end
      end)
      |> Enum.filter(fn text -> text != "" end)

    assert Enum.member?(paragraph_texts, "Good things happened")
  end
end
