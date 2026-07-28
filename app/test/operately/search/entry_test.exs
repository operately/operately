defmodule Operately.Search.EntryTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Search.Entry
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
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
        body: "customer research",
        source_updated_at: ctx.project.updated_at
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
    |> Entry.changeset(%{title: "Launch roadmap", body: "delivery plan"})
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

  test "derives the normalized title instead of trusting caller input", ctx do
    context = Access.get_context!(project_id: ctx.project.id)

    entry =
      %{
        source_type: :project,
        source_id: ctx.project.id,
        company_id: ctx.company.id,
        access_context_id: context.id,
        title: "  Ｃａｆé   Roadmap  ",
        normalized_title: "incorrect caller value",
        source_updated_at: ctx.project.updated_at
      }
      |> Entry.changeset()
      |> Repo.insert!()

    assert entry.normalized_title == "cafe roadmap"

    updated_entry =
      entry
      |> Entry.changeset(%{title: "  Résumé   Plan ", normalized_title: "another incorrect value"})
      |> Repo.update!()

    assert updated_entry.normalized_title == "resume plan"
  end

  test "requires a source version" do
    assert [["NO"]] =
             Repo.query!("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'search_entries' AND column_name = 'source_updated_at'").rows
  end
end
