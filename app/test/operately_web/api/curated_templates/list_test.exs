defmodule OperatelyWeb.Api.CuratedTemplates.ListTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_curated_template(:draft)
    |> Factory.add_curated_template(:published, published: true, title: "A", category: "Sales")
    |> Factory.add_curated_template(:goal, published: true, type: :goal, title: "B")
    |> Factory.add_curated_template(:archived, published: true, archived: true)
  end

  test "anonymous readers receive only discoverable summaries", ctx do
    assert {200, %{templates: [template], total: 2}} = query(ctx.conn, [:curated_templates, :list], %{limit: 1})
    assert template.id == Paths.curated_template_id(ctx.published)
    assert template.updated_at != nil
    assert Enum.sort(Map.keys(template)) == Enum.sort([:__typename, :id, :type, :title, :summary, :category, :content_language, :updated_at])
    assert {200, %{templates: [template]}} = query(ctx.conn, [:curated_templates, :list], %{type: "goal", offset: 0})
    assert template.type == "goal"
    assert {200, %{total: 1}} = query(ctx.conn, [:curated_templates, :list], %{category: "Sales"})
    assert {200, %{templates: []}} = query(ctx.conn, [:curated_templates, :list], %{offset: 2})
  end

  test "rejects invalid pagination and filters", ctx do
    for inputs <- [%{limit: 101}, %{limit: 0}, %{offset: -1}, %{offset: 1_000_001}, %{limit: "abc"}, %{type: "other"}, %{category: ["Sales"]}, %{limit: [20]}, %{category: String.duplicate("a", 401)}] do
      assert {400, _} = query(ctx.conn, [:curated_templates, :list], inputs)
    end
  end

  test "defaults to twenty results and permits up to one hundred", ctx do
    for index <- 1..20, do: Factory.add_curated_template(ctx, :template, published: true, title: "Template #{index}")
    assert {200, %{templates: templates, total: 22}} = query(ctx.conn, [:curated_templates, :list], %{})
    assert length(templates) == 20
    assert {200, %{templates: templates, total: 22}} = query(ctx.conn, [:curated_templates, :list], %{limit: 100})
    assert length(templates) == 22
  end
end
