defmodule OperatelyWeb.Api.CuratedTemplates.GetTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_curated_template(:draft)
    |> Factory.add_curated_template(:published, published: true)
  end

  test "anonymous readers receive published content", ctx do
    assert {200, %{template: returned}} = query(ctx.conn, [:curated_templates, :get], %{id: Paths.curated_template_id(ctx.published)})
    assert Jason.decode!(returned.definition) == ctx.published.definition
    assert Enum.sort(Map.keys(returned)) == Enum.sort([:__typename, :id, :type, :title, :summary, :category, :content_language, :updated_at, :definition])
  end

  test "signed-in readers can read published templates", ctx do
    ctx = Factory.log_in_person(ctx, :creator)
    assert {200, %{template: returned}} = query(ctx.conn, [:curated_templates, :get], %{id: Paths.curated_template_id(ctx.published)})
    assert Jason.decode!(returned.definition) == ctx.published.definition
  end

  test "accepts UUIDs, encoded IDs and old title links", ctx do
    {:ok, updated} = Operately.Operations.CuratedTemplateUpdating.run(ctx.published, ctx.account, ctx.published.updated_at, {:update, %{title: "Renamed"}})

    for id <- [ctx.published.id, Operately.ShortUuid.encode!(ctx.published.id), Paths.curated_template_id(ctx.published)] do
      assert {200, %{template: returned}} = query(ctx.conn, [:curated_templates, :get], %{id: id})
      assert returned.id == Paths.curated_template_id(updated)
      assert returned.title == "Renamed"
    end
  end

  test "drafts and unknown or malformed IDs are unavailable", ctx do
    for id <- [Paths.curated_template_id(ctx.draft), "bad!", String.duplicate("9", 22), Operately.ShortUuid.generate()] do
      assert {404, _} = query(ctx.conn, [:curated_templates, :get], %{id: id})
    end
  end
end
