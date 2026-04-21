defmodule Operately.CompanyTransfers.Import.RichTextRewriterTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{RichTextRewriter, TranslationPlan}
  alias Operately.CompanyTransfers.Schema.AppSchemas
  alias Operately.People.Person
  alias Operately.RichContent
  alias Operately.ShortUuid
  alias Operately.Support.RichText
  alias OperatelyWeb.Api.Helpers

  test "rewrites one mention in a top-level TipTap doc" do
    source_person = person("Source Person")
    destination_person_id = Ecto.UUID.generate()
    plan = translation_plan(%{source_person.id => destination_person_id})

    row = %{"content" => mention_doc([source_person])}

    assert {:ok, rewritten} = RichTextRewriter.rewrite_row_mentions(row, "resource_documents", plan, map_fields_for("resource_documents"))
    assert RichContent.find_mentioned_ids(rewritten["content"]) == [encoded_person_id("Source Person", destination_person_id)]
  end

  test "rewrites multiple mentions in a top-level TipTap doc" do
    first_source_person = person("First Person")
    second_source_person = person("Second Person")
    first_destination_id = Ecto.UUID.generate()
    second_destination_id = Ecto.UUID.generate()

    plan =
      translation_plan(%{
        first_source_person.id => first_destination_id,
        second_source_person.id => second_destination_id
      })

    row = %{"content" => mention_doc([first_source_person, second_source_person])}

    assert {:ok, rewritten} = RichTextRewriter.rewrite_row_mentions(row, "resource_documents", plan, map_fields_for("resource_documents"))

    assert RichContent.find_mentioned_ids(rewritten["content"]) == [
             encoded_person_id("First Person", first_destination_id),
             encoded_person_id("Second Person", second_destination_id)
           ]
  end

  test "leaves non-TipTap map fields unchanged" do
    row = %{"content" => %{"message" => "plain map"}}

    assert {:ok, ^row} = RichTextRewriter.rewrite_row_mentions(row, "resource_documents", translation_plan(%{}), map_fields_for("resource_documents"))
  end

  test "rewrites mentions in comment content" do
    source_person = person("Comment Mention")
    destination_person_id = Ecto.UUID.generate()
    row = %{"content" => mention_doc([source_person])}
    plan = translation_plan(%{source_person.id => destination_person_id})

    assert {:ok, rewritten} = RichTextRewriter.rewrite_row_mentions(row, "comments", plan, map_fields_for("comments"))
    assert RichContent.find_mentioned_ids(rewritten["content"]) == [encoded_person_id("Comment Mention", destination_person_id)]
  end

  test "fails when a decoded mention id has no translation" do
    source_person = person("Missing Translation")
    source_person_id = source_person.id
    row = %{"content" => mention_doc([source_person])}

    assert {:error, {:missing_rich_text_mention_translation, "resource_documents", "content", ^source_person_id}} =
             RichTextRewriter.rewrite_row_mentions(row, "resource_documents", translation_plan(%{}), map_fields_for("resource_documents"))
  end

  defp person(full_name) do
    %Person{id: Ecto.UUID.generate(), full_name: full_name}
  end

  defp translation_plan(people_map) do
    %TranslationPlan{id_map: %{"people" => people_map}, table_index: %{}}
  end

  defp mention_doc(people) do
    RichText.rich_text(mentioned_people: people)
    |> Jason.decode!()
  end

  defp encoded_person_id(label, person_id) do
    Helpers.id_with_comments(label, ShortUuid.encode!(person_id))
  end

  defp map_fields_for(table) do
    AppSchemas.map_fields_for_table(table)
  end
end
