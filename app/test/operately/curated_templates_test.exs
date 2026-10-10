defmodule Operately.CuratedTemplatesTest do
  use Operately.DataCase, async: true

  alias Operately.CuratedTemplates
  alias Operately.CuratedTemplates.Template
  alias Operately.Support.Factory

  setup ctx, do: Factory.setup(ctx)

  describe "create/2" do
    test "creates an incomplete draft owned by the authenticated editor", ctx do
      assert {:ok, template} = CuratedTemplates.create(ctx.account, %{type: :project, title: "Launch", state: :published, creator_account_id: Ecto.UUID.generate()})
      assert template.state == :draft
      assert template.creator_account_id == ctx.account.id
      assert template.updater_account_id == ctx.account.id
      assert template.published_at == nil
    end

    test "invalid content leaves no template behind", ctx do
      assert {:error, %Ecto.Changeset{}} = CuratedTemplates.create(ctx.account, %{type: :kpi, title: "Revenue", definition: %{"unit" => []}})
      assert Repo.aggregate(Template, :count) == 0
    end
  end

  describe "delete/2" do
    test "permanently deletes draft and published templates", ctx do
      for opts <- [[], [published: true]] do
        ctx = Factory.add_curated_template(ctx, :template, opts)
        assert {:ok, deleted} = CuratedTemplates.delete(ctx.template, ctx.template.updated_at)
        assert deleted.id == ctx.template.id
        assert CuratedTemplates.get(ctx.template.id) == nil
      end
    end

    test "a stale timestamp cannot delete a template changed since review", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      {:ok, updated} = Operately.Operations.CuratedTemplateUpdating.run(ctx.template, ctx.account, ctx.template.updated_at, {:update, %{title: "Updated"}})

      for template <- [ctx.template, updated] do
        assert {:error, :conflict} = CuratedTemplates.delete(template, ctx.template.updated_at)
      end

      assert CuratedTemplates.get(updated.id).title == "Updated"
    end
  end

  describe "list/2" do
    test "returns an empty catalog when nothing matches", ctx do
      assert CuratedTemplates.list(%{}, :admin) == %{templates: [], total: 0}

      Factory.add_curated_template(ctx, :template, category: "Sales")
      assert CuratedTemplates.list(%{category: "Engineering"}, :admin) == %{templates: [], total: 0}
    end

    test "public visibility excludes drafts even with explicit filters", ctx do
      ctx =
        ctx
        |> Factory.add_curated_template(:draft)
        |> Factory.add_curated_template(:published, published: true)

      assert %{templates: [template], total: 1} = CuratedTemplates.list(%{}, :public)
      assert template.id == ctx.published.id
      assert CuratedTemplates.list(%{state: :draft}, :public) == %{templates: [], total: 0}
    end

    test "admin visibility includes drafts and published templates", ctx do
      ctx =
        ctx
        |> Factory.add_curated_template(:draft)
        |> Factory.add_curated_template(:published, published: true)

      assert %{templates: templates, total: 2} = CuratedTemplates.list(%{}, :admin)

      assert MapSet.new(templates, & &1.id) == MapSet.new([ctx.draft.id, ctx.published.id])
    end

    test "combines exact type, state and category filters and ignores blank filters", ctx do
      ctx =
        ctx
        |> Factory.add_curated_template(:goal, type: :goal, published: true, category: "Sales")
        |> Factory.add_curated_template(:draft_goal, type: :goal, category: "Sales")
        |> Factory.add_curated_template(:other_goal, type: :goal, published: true, category: "Sales operations")
        |> Factory.add_curated_template(:kpi, type: :kpi, published: true, category: "Sales")
        |> Factory.add_curated_template(:project, type: :project, published: true, category: "Sales")

      assert %{templates: [template], total: 1} = CuratedTemplates.list(%{type: :goal, state: :published, category: "Sales"}, :admin)
      assert template.id == ctx.goal.id

      for type <- [:kpi, :project] do
        assert %{templates: [template], total: 1} = CuratedTemplates.list(%{type: type}, :admin)
        assert template.id == ctx[type].id
      end

      for blank <- [nil, ""] do
        assert %{total: 5} = CuratedTemplates.list(%{type: blank, state: blank, category: blank, search: blank}, :admin)
      end
    end

    test "search matches title substrings case-insensitively and escapes SQL wildcards", ctx do
      ctx =
        ctx
        |> Factory.add_curated_template(:literal, title: "Revenue 50%_\\ growth")
        |> Factory.add_curated_template(:ordinary, title: "Revenue 500 growth")
        |> Factory.add_curated_template(:other, title: "Retention")

      assert %{templates: templates, total: 2} = CuratedTemplates.list(%{search: "VENue"}, :admin)
      assert MapSet.new(templates, & &1.id) == MapSet.new([ctx.literal.id, ctx.ordinary.id])

      for search <- ["%", "_", "\\", "50%_\\"] do
        assert %{templates: [template], total: 1} = CuratedTemplates.list(%{search: search}, :admin)
        assert template.id == ctx.literal.id
      end
    end

    test "orders by title and ID and counts matches before pagination", ctx do
      ctx =
        ctx
        |> Factory.add_curated_template(:last, title: "Zebra", category: "Sales")
        |> Factory.add_curated_template(:first, title: "Alpha", category: "Sales")
        |> Factory.add_curated_template(:tie, title: "Alpha", category: "Sales")
        |> Factory.add_curated_template(:excluded, title: "Other", category: "Engineering")

      [first_id, second_id] = Enum.sort([ctx.first.id, ctx.tie.id])
      filters = %{category: "Sales"}

      assert %{templates: templates, total: 3} = CuratedTemplates.list(filters, :admin)
      assert Enum.map(templates, & &1.id) == [first_id, second_id, ctx.last.id]

      assert %{templates: [template], total: 3} = CuratedTemplates.list(Map.merge(filters, %{limit: 1, offset: 1}), :admin)
      assert template.id == second_id
      assert %{templates: [], total: 3} = CuratedTemplates.list(Map.put(filters, :offset, 3), :admin)

      assert %{templates: [template], total: 3} = CuratedTemplates.list(Map.merge(filters, %{limit: 0, offset: -1}), :admin)
      assert template.id == first_id
    end

    test "public catalog defaults to 20 results and caps the limit at 100", ctx do
      for index <- 1..101 do
        Factory.add_curated_template(ctx, :template, title: "Template #{index}", published: true)
      end

      assert %{templates: templates, total: 101} = CuratedTemplates.list(%{}, :public)
      assert length(templates) == 20
      assert %{templates: templates, total: 101} = CuratedTemplates.list(%{limit: 200}, :public)
      assert length(templates) == 100
    end

    test "returns catalog metadata without definitions or editor accounts", ctx do
      ctx = Factory.add_curated_template(ctx, :template, category: "Sales", published: true)

      assert %{templates: [template]} = CuratedTemplates.list(%{}, :admin)
      assert template.id == ctx.template.id
      assert template.title == ctx.template.title
      assert template.type == :kpi
      assert template.state == :published
      assert template.category == "Sales"
      assert template.content_language == "en"
      assert template.published_at == ctx.template.published_at
      assert %Template{} = template
      assert template.summary == ctx.template.summary
      assert template.updated_at == ctx.template.updated_at
      assert template.definition == %{}
      assert template.creator_account_id == nil
      assert template.updater_account_id == nil
    end
  end
end
