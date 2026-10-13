defmodule Operately.Data.Change117BackfillCuratedTemplateSlugsTest do
  use Operately.DataCase

  alias Operately.Data.Change117BackfillCuratedTemplateSlugs, as: Change
  alias Operately.CuratedTemplates.Template

  setup ctx do
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE curated_templates ALTER COLUMN slug DROP NOT NULL")
    Factory.setup(ctx)
  end

  test "generates slugs for existing drafts and published templates", ctx do
    ctx =
      ctx
      |> Factory.add_curated_template(:draft, title: "Monthly Website Visitors")
      |> Factory.add_curated_template(:published, title: "Conversão / Регистрации!", published: true)

    clear_slugs([ctx.draft, ctx.published])
    Change.run()

    assert slug(ctx.draft) == "monthly-website-visitors"
    assert slug(ctx.published) == "conversao-регистрации"
    assert Repo.get!(Template, ctx.published.id).state == :published
  end

  test "resolves collisions within each language and preserves existing slugs", ctx do
    ctx =
      ctx
      |> Factory.add_curated_template(:existing, slug: "revenue")
      |> Factory.add_curated_template(:suffix, slug: "revenue-2")
      |> Factory.add_curated_template(:first, title: "Revenue")
      |> Factory.add_curated_template(:second, title: "Revenue!")
      |> Factory.add_curated_template(:translated, title: "Revenue", content_language: "de")

    clear_slugs([ctx.first, ctx.second, ctx.translated])
    Change.run()

    assert slug(ctx.existing) == "revenue"
    assert slug(ctx.suffix) == "revenue-2"
    assert Enum.sort([slug(ctx.first), slug(ctx.second)]) == ["revenue-3", "revenue-4"]
    assert slug(ctx.translated) == "revenue"
  end

  test "handles titles without letters or numbers and long duplicate titles", ctx do
    title = String.duplicate("a", 200)

    ctx =
      ctx
      |> Factory.add_curated_template(:symbols, title: "!!!")
      |> Factory.add_curated_template(:first, title: title)
      |> Factory.add_curated_template(:second, title: title)

    clear_slugs([ctx.symbols, ctx.first, ctx.second])
    Change.run()

    assert slug(ctx.symbols) == "template"
    assert Enum.sort([slug(ctx.first), slug(ctx.second)]) == Enum.sort([title, String.duplicate("a", 198) <> "-2"])
  end

  test "rerunning preserves generated slugs", ctx do
    ctx = Factory.add_curated_template(ctx, :template, title: "Revenue")
    clear_slugs([ctx.template])
    Change.run()
    first_slug = slug(ctx.template)

    Change.run()

    assert slug(ctx.template) == first_slug
  end

  test "schema migration upgrades a populated table and supports rollback", ctx do
    ctx =
      ctx
      |> Factory.add_curated_template(:first, title: "Revenue")
      |> Factory.add_curated_template(:second, title: "Revenue")

    # DDL is rolled back with this test's sandbox transaction.
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE curated_templates DROP COLUMN slug")
    Code.require_file("priv/repo/migrations/20261013190333_add_slug_to_curated_templates.exs")
    migration = Operately.Repo.Migrations.AddSlugToCuratedTemplates

    Ecto.Migration.Runner.run(Repo, Repo.config(), 20_261_013_190_333, migration, :forward, :up, :up, log: false)

    assert Enum.sort([slug(ctx.first), slug(ctx.second)]) == ["revenue", "revenue-2"]
    assert %{rows: [["NO"]]} = slug_column()

    assert %{rows: [[true]]} =
             Ecto.Adapters.SQL.query!(Repo, """
             SELECT indisunique FROM pg_index
             WHERE indexrelid = 'curated_templates_slug_content_language_index'::regclass
             """)

    Ecto.Migration.Runner.run(Repo, Repo.config(), 20_261_013_190_333, migration, :forward, :down, :down, log: false)
    assert %{rows: []} = slug_column()
  end

  defp slug_column do
    Ecto.Adapters.SQL.query!(Repo, """
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'curated_templates' AND column_name = 'slug'
    """)
  end

  defp clear_slugs(templates) do
    ids = Enum.map(templates, & &1.id)
    from(t in Template, where: t.id in ^ids) |> Repo.update_all(set: [slug: nil])
  end

  defp slug(template), do: Repo.get!(Template, template.id).slug
end
