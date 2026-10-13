defmodule OperatelyWeb.Api.CuratedTemplates.GetTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_curated_template(:draft, slug: "draft")
    |> Factory.add_curated_template(:published, slug: "website-visitors", published: true)
    |> Factory.add_curated_template(:translated, slug: "website-visitors", content_language: "pt-BR", published: true)
  end

  test "anonymous readers resolve published templates by slug and language", ctx do
    for template <- [ctx.published, ctx.translated] do
      assert {200, %{template: returned}} = query(ctx.conn, [:curated_templates, :get], %{slug: template.slug, language: template.content_language})
      assert returned.id == Paths.curated_template_id(template)
      assert returned.slug == template.slug
      assert returned.content_language == template.content_language
      assert Jason.decode!(returned.definition) == template.definition
      assert Enum.sort(Map.keys(returned)) == Enum.sort([:__typename, :id, :slug, :type, :title, :summary, :category, :content_language, :updated_at, :definition])
    end
  end

  test "drafts, unknown slugs, and missing translations are unavailable", ctx do
    for {slug, language} <- [{ctx.draft.slug, "en"}, {"unknown", "en"}, {ctx.published.slug, "de"}] do
      assert {404, _} = query(ctx.conn, [:curated_templates, :get], %{slug: slug, language: language})
    end
  end

  test "requires slug and language instead of an ID", ctx do
    for inputs <- [%{id: ctx.published.id}, %{slug: ctx.published.slug}, %{language: "en"}] do
      assert {400, _} = query(ctx.conn, [:curated_templates, :get], inputs)
    end
  end

  test "renaming a slug changes its lookup without changing its ID", ctx do
    {:ok, updated} = Operately.Operations.CuratedTemplateUpdating.run(ctx.published, ctx.account, ctx.published.updated_at, {:update, %{slug: "monthly-visitors"}})
    assert {404, _} = query(ctx.conn, [:curated_templates, :get], %{slug: ctx.published.slug, language: "en"})
    assert {200, %{template: returned}} = query(ctx.conn, [:curated_templates, :get], %{slug: updated.slug, language: "en"})
    assert returned.id == Paths.curated_template_id(ctx.published)
  end
end
