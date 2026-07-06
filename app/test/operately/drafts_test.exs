defmodule Operately.DraftsTest do
  use ExUnit.Case, async: true

  alias Operately.Drafts

  describe "display_date/1" do
    test "returns inserted_at as DateTime for drafts" do
      inserted_at = ~N[2026-01-01 10:00:00]

      assert Drafts.display_date(%{state: :draft, inserted_at: inserted_at}) == ~U[2026-01-01 10:00:00Z]
    end

    test "returns published_at for published resources" do
      inserted_at = ~N[2026-01-01 10:00:00]
      published_at = ~U[2026-01-05 10:00:00Z]

      assert Drafts.display_date(%{
               state: :published,
               inserted_at: inserted_at,
               published_at: published_at
             }) == published_at
    end

    test "falls back to inserted_at when published_at is nil" do
      inserted_at = ~N[2026-01-01 10:00:00]

      assert Drafts.display_date(%{
               state: :published,
               inserted_at: inserted_at,
               published_at: nil
             }) == ~U[2026-01-01 10:00:00Z]
    end
  end

  describe "sort_by_display_date_desc/2" do
    test "sorts resources by display date descending" do
      older = %{state: :published, inserted_at: ~N[2026-01-01 10:00:00], published_at: ~U[2026-01-02 10:00:00Z]}
      newer = %{state: :published, inserted_at: ~N[2026-01-01 10:00:00], published_at: ~U[2026-01-05 10:00:00Z]}

      assert Drafts.sort_by_display_date_desc([older, newer]) == [newer, older]
    end

    test "sorts drafts and published resources by normalized display date" do
      draft = %{state: :draft, inserted_at: ~N[2026-01-10 10:00:00]}
      published = %{state: :published, inserted_at: ~N[2026-01-01 10:00:00], published_at: ~U[2026-01-05 10:00:00Z]}

      assert Drafts.sort_by_display_date_desc([published, draft]) == [draft, published]
    end
  end

  describe "node_display_date/1" do
    test "uses document display date for document nodes" do
      document = %{state: :published, inserted_at: ~N[2026-01-01 10:00:00], published_at: ~U[2026-01-05 10:00:00Z]}
      node = %{type: :document, document: document, inserted_at: ~N[2026-01-01 10:00:00]}

      assert Drafts.node_display_date(node) == ~U[2026-01-05 10:00:00Z]
    end

    test "uses node inserted_at as DateTime for non-document nodes" do
      node = %{type: :folder, document: nil, inserted_at: ~N[2026-01-03 10:00:00]}

      assert Drafts.node_display_date(node) == ~U[2026-01-03 10:00:00Z]
    end
  end
end
