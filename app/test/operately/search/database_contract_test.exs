defmodule Operately.Search.DatabaseContractTest do
  use Operately.DataCase, async: true

  test "installs the accent-insensitive text configuration and required extensions" do
    extensions = Repo.query!("SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm') ORDER BY extname").rows
    assert extensions == [["pg_trgm"], ["unaccent"]]

    assert [[true]] =
             Repo.query!("SELECT to_tsvector('public.operately'::regconfig, 'Hôtel') @@ to_tsquery('public.operately'::regconfig, 'hotel')").rows
  end

  test "creates the generated search vector and expected indexes" do
    assert [["ALWAYS"]] =
             Repo.query!("SELECT is_generated FROM information_schema.columns WHERE table_name = 'search_entries' AND column_name = 'search_vector'").rows

    index_definitions =
      Repo.query!("SELECT indexdef FROM pg_indexes WHERE tablename = 'search_entries'").rows
      |> List.flatten()
      |> Enum.join("\n")

    assert index_definitions =~ "search_entries_search_vector_index"
    assert index_definitions =~ "USING gin (search_vector)"
    assert index_definitions =~ "search_entries_normalized_title_trgm_index"
    assert index_definitions =~ "gin_trgm_ops"
  end
end
