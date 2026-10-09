defmodule OperatelyEE.AdminApi.CuratedTemplates.ListTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, [:curated_templates, :list], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_query(ctx.conn, [:curated_templates, :list], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "lists drafts and published templates with filters and pagination", ctx do
      ctx = ctx |> Factory.add_curated_template(:published, type: :goal, published: true, title: "A", category: "Sales") |> Factory.add_curated_template(:draft, title: "B")
      assert {200, %{templates: [returned], total: 2}} = admin_query(ctx.conn, [:curated_templates, :list], %{limit: 1})
      assert returned.id == Paths.curated_template_id(ctx.published)
      assert {200, %{templates: [returned], total: 1}} = admin_query(ctx.conn, [:curated_templates, :list], %{type: "kpi", state: "draft", search: "B"})
      assert returned.id == Paths.curated_template_id(ctx.draft)
      assert {200, %{templates: [], total: 0}} = admin_query(ctx.conn, [:curated_templates, :list], %{category: "missing"})
    end

    test "returns summaries without a placeholder definition", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true, archived: true)
      assert {200, %{templates: [summary]}} = admin_query(ctx.conn, [:curated_templates, :list], %{})
      assert summary.__typename == "curated_template"
      assert summary.state == "published"
      assert summary.archived_at == DateTime.to_iso8601(ctx.template.archived_at)
      assert summary.published_at == DateTime.to_iso8601(ctx.template.published_at)
      assert summary.updated_at == DateTime.to_iso8601(ctx.template.updated_at)
      refute Map.has_key?(summary, :definition)
    end

    test "returns an empty catalog", ctx do
      assert {200, %{templates: [], total: 0}} = admin_query(ctx.conn, [:curated_templates, :list], %{})
    end
  end
end
