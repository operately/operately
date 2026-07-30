defmodule Operately.Search.TextTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Text

  describe "searchable_query?/1" do
    test "accepts queries at the character and byte boundaries" do
      maximum_byte_query = String.duplicate("😀", 500)

      assert byte_size(maximum_byte_query) == 2_000
      assert Text.searchable_query?("customer research")
      assert Text.searchable_query?(String.duplicate("a", 500))
      assert Text.searchable_query?(maximum_byte_query)
      assert Text.prepare_query("  customer \n research  ") == {:ok, "customer research"}
    end

    test "rejects short, oversized, invalid, and non-string queries" do
      oversized_bytes = String.duplicate("🧑🏽‍💻", 134)

      assert String.length(oversized_bytes) < 500
      assert byte_size(oversized_bytes) > 2_000

      refute Text.searchable_query?("a")
      refute Text.searchable_query?(String.duplicate("a", 501))
      refute Text.searchable_query?(String.duplicate("é", 501))
      refute Text.searchable_query?(oversized_bytes)
      refute Text.searchable_query?(<<0, ?x>>)
      refute Text.searchable_query?(<<255, 255>>)
      refute Text.searchable_query?("\u0301\u0301")
      refute Text.searchable_query?(nil)
    end
  end

  describe "normalize_search_term/1" do
    test "collapses hyphens, underscores, and whitespace" do
      assert Text.normalize_search_term("re-establish") == "re establish"
      assert Text.normalize_search_term("re_establish") == "re establish"
      assert Text.normalize_search_term("  re   establish  ") == "re establish"
      assert Text.normalize_search_term("---") == ""
      assert Text.normalize_search_term(nil) == ""
    end
  end

  describe "search_tsquery/1" do
    test "builds a prefix tsquery for the last typed token" do
      assert Text.search_tsquery("just a t") == {:prefix, "'just' & 'a' & 't':*"}
      assert Text.search_tsquery("navig") == {:prefix, "'navig':*"}
      assert Text.search_tsquery("Enterprise research") == {:prefix, "'enterprise' & 'research':*"}
    end

    test "folds accents and case before building the prefix tsquery" do
      assert Text.search_tsquery("CAFÉ handb") == {:prefix, "'cafe' & 'handb':*"}
    end

    test "builds prefix tsqueries for non-Latin words" do
      assert Text.search_tsquery("Навигац") == {:prefix, "'навигац':*"}
      assert Text.search_tsquery("東京") == {:prefix, "'東京':*"}
    end

    test "keeps phrases and OR syntax on the websearch path" do
      assert Text.search_tsquery(~s("customer research")) == {:websearch, ~s("customer research")}
      assert Text.search_tsquery("customer OR archive") == {:websearch, "customer OR archive"}
    end

    test "treats unary minus as punctuation instead of exclusion syntax" do
      assert Text.prepare_query("customer -archive") == {:ok, "customer archive"}
      assert Text.search_tsquery("customer -archive") == {:prefix, "'customer' & 'archive':*"}
      assert Text.search_tsquery("-support@operately.com") == {:websearch, "support@operately.com"}
      assert Text.search_tsquery("alpha - beta") == {:prefix, "'alpha' & 'beta':*"}

      refute Text.searchable_query?("-a")
    end

    test "keeps structured lexemes on the websearch path" do
      for query <- [
            "support@operately.com",
            "example.com",
            "3.14",
            "2026-07-27",
            "14:30",
            "v1.2.3",
            "/docs/start",
            "alpha-beta"
          ] do
        assert Text.search_tsquery(query) == {:websearch, query}
      end
    end

    test "keeps mixed plain and structured terms on the websearch path" do
      query = "contact support@operately.com"

      assert Text.search_tsquery(query) == {:websearch, query}
    end

    test "does not add prefix operators inside punctuation-bearing terms" do
      assert Text.search_tsquery("alpha-be") == {:websearch, "alpha-be"}
    end

    test "removes URL schemes to match PostgreSQL's indexed URL lexemes" do
      assert Text.search_tsquery("https://operately.com/docs/search") ==
               {:websearch, "operately.com/docs/search"}

      assert Text.search_tsquery("visit HTTP://operately.com/docs/search") ==
               {:websearch, "visit operately.com/docs/search"}
    end

    test "falls back to websearch when no searchable tokens remain" do
      assert Text.search_tsquery("!!!") == {:websearch, "!!!"}
      assert Text.search_tsquery("   ") == {:websearch, ""}
    end
  end
end
