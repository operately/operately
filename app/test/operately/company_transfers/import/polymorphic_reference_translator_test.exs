defmodule Operately.CompanyTransfers.Import.PolymorphicReferenceTranslatorTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{PolymorphicReferenceTranslator, TranslationPlan}

  test "translates a supported polymorphic reference" do
    source_thread_id = Ecto.UUID.generate()
    destination_thread_id = Ecto.UUID.generate()

    row = %{"entity_type" => "comment_thread", "entity_id" => source_thread_id}
    plan = translation_plan(%{"comment_threads" => %{source_thread_id => destination_thread_id}})

    assert {:ok, rewritten} = PolymorphicReferenceTranslator.translate_row(row, "comments", plan)
    assert rewritten["entity_id"] == destination_thread_id
  end

  test "skips a row when its polymorphic parent cannot be translated" do
    row = %{"entity_type" => "comment", "entity_id" => Ecto.UUID.generate()}

    assert {:skip, {:missing_polymorphic_reference, "reactions", "entity_id", "comments", _source_id}} =
             PolymorphicReferenceTranslator.translate_row(row, "reactions", translation_plan(%{}))
  end

  test "fails on unsupported polymorphic types" do
    row = %{"parent_type" => "space", "parent_id" => Ecto.UUID.generate()}

    assert {:error, {:unsupported_polymorphic_type, "comment_threads", "parent_type", "space"}} =
             PolymorphicReferenceTranslator.translate_row(row, "comment_threads", translation_plan(%{}))
  end

  defp translation_plan(id_map) do
    %TranslationPlan{id_map: id_map, table_index: %{}}
  end
end
