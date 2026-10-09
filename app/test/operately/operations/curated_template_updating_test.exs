defmodule Operately.Operations.CuratedTemplateUpdatingTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias Operately.Operations.CuratedTemplateUpdating, as: Updating
  alias Operately.CuratedTemplates

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_curated_template(:template)
  end

  test "publishes each type and records the editor", ctx do
    for type <- [:kpi, :goal, :project] do
      ctx = Factory.add_curated_template(ctx, :template, type: type)
      assert {:ok, published} = Updating.run(ctx.template, ctx.account, ctx.template.updated_at, :publish)
      assert published.state == :published
      assert published.published_at
      assert published.updater_account_id == ctx.account.id
      assert CuratedTemplates.get_published(published.id)
    end
  end

  test "stale writes cannot overwrite a newer edit", ctx do
    assert {:ok, updated} = Updating.run(ctx.template, ctx.account, ctx.template.updated_at, {:update, %{title: "New"}})

    for action <- [:publish, {:metadata, %{archived: true}}, {:update, %{title: "Stale"}}] do
      assert {:error, :conflict} = Updating.run(ctx.template, ctx.account, ctx.template.updated_at, action)
    end

    assert CuratedTemplates.get(updated.id).title == "New"
  end

  test "invalid publication leaves the draft unchanged", ctx do
    ctx = Factory.add_curated_template(ctx, :incomplete, definition: %{})
    assert {:error, %Ecto.Changeset{}} = Updating.run(ctx.incomplete, ctx.account, ctx.incomplete.updated_at, :publish)
    assert CuratedTemplates.get(ctx.incomplete.id).state == :draft
  end

  test "published updates require complete definitions", ctx do
    {:ok, published} = Updating.run(ctx.template, ctx.account, ctx.template.updated_at, :publish)
    assert {:error, %Ecto.Changeset{}} = Updating.run(published, ctx.account, published.updated_at, {:update, %{definition: %{}}})
    assert CuratedTemplates.get(published.id).definition["name"] == "Revenue"
  end

  test "archive removes discovery but preserves published detail; restore reverses it", ctx do
    {:ok, published} = Updating.run(ctx.template, ctx.account, ctx.template.updated_at, :publish)
    {:ok, archived} = Updating.run(published, ctx.account, published.updated_at, {:metadata, %{archived: true}})
    assert CuratedTemplates.list(%{}, :public).templates == []
    assert CuratedTemplates.get_published(archived.id)
    {:ok, _} = Updating.run(archived, ctx.account, archived.updated_at, {:metadata, %{archived: false}})
    assert length(CuratedTemplates.list(%{}, :public).templates) == 1
  end
end
