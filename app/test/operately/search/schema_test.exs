defmodule Operately.Search.SchemaTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Search.Entry
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "installs the accent-insensitive text configuration and required extensions" do
    extensions = Repo.query!("SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm') ORDER BY extname").rows
    assert extensions == [["pg_trgm"], ["unaccent"]]

    assert [[true]] =
             Repo.query!("SELECT to_tsvector('public.operately'::regconfig, 'Hôtel') @@ to_tsquery('public.operately'::regconfig, 'hotel')").rows
  end

  test "generates a weighted vector that updates with title and body changes", ctx do
    context = Access.get_context!(project_id: ctx.project.id)

    entry =
      %{
        source_type: "project",
        source_id: ctx.project.id,
        company_id: ctx.company.id,
        access_context_id: context.id,
        title: "Café roadmap",
        normalized_title: "cafe roadmap",
        body: "customer research"
      }
      |> Entry.changeset()
      |> Repo.insert!()

    assert [[true, true]] =
             Repo.query!(
               """
               SELECT
                 search_vector @@ to_tsquery('public.operately'::regconfig, 'cafe:A'),
                 search_vector @@ to_tsquery('public.operately'::regconfig, 'research:B')
               FROM search_entries
               WHERE id = $1
               """,
               [Ecto.UUID.dump!(entry.id)]
             ).rows

    entry
    |> Entry.changeset(%{title: "Launch roadmap", normalized_title: "launch roadmap", body: "delivery plan"})
    |> Repo.update!()

    assert [[false, true]] =
             Repo.query!(
               """
               SELECT
                 search_vector @@ to_tsquery('public.operately'::regconfig, 'research'),
                 search_vector @@ to_tsquery('public.operately'::regconfig, 'delivery:B')
               FROM search_entries
               WHERE id = $1
               """,
               [Ecto.UUID.dump!(entry.id)]
             ).rows
  end

  test "creates the generated column and expected GIN indexes" do
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
