defmodule Operately.Search.TextTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Text

  describe "search_tsquery/1" do
    test "builds a prefix tsquery for the last typed token" do
      assert Text.search_tsquery("just a t") == {:prefix, "'just' & 'a' & 't':*"}
      assert Text.search_tsquery("navig") == {:prefix, "'navig':*"}
      assert Text.search_tsquery("Enterprise research") == {:prefix, "'enterprise' & 'research':*"}
    end

    test "folds accents and case before building the prefix tsquery" do
      assert Text.search_tsquery("CAFÉ handb") == {:prefix, "'cafe' & 'handb':*"}
    end

    test "keeps websearch syntax on the websearch path" do
      assert Text.search_tsquery(~s("customer research")) == {:websearch, ~s("customer research")}
      assert Text.search_tsquery("customer -archive") == {:websearch, "customer -archive"}
      assert Text.search_tsquery("customer OR archive") == {:websearch, "customer OR archive"}
    end

    test "falls back to websearch when no searchable tokens remain" do
      assert Text.search_tsquery("!!!") == {:websearch, "!!!"}
      assert Text.search_tsquery("   ") == {:websearch, ""}
    end
  end
end
