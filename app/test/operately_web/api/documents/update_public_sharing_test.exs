defmodule OperatelyWeb.Api.Documents.UpdatePublicSharingTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query

  alias Operately.ResourceHubs.Document

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, state: :published)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
  end

  test "enables idempotently, revokes, and generates a new link", ctx do
    ctx = Factory.log_in_person(ctx, :creator)
    assert {200, %{public_url: first}} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
    assert is_binary(first)
    assert {200, %{public_url: ^first}} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
    assert {200, %{public_url: nil}} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, false))
    assert Repo.get!(Document, ctx.document.id).public_token == nil
    assert {200, %{public_url: second}} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
    refute first == second

    activities = Repo.all(from a in Operately.Activities.Activity, where: a.action == "resource_hub_document_public_sharing_changed")
    assert length(activities) == 3
    refute Jason.encode!(activities |> Enum.map(& &1.content)) =~ first
  end

  test "rejects drafts", ctx do
    ctx = Factory.log_in_person(ctx, :creator)
    ctx.document |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
    assert {400, _} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
  end

  test "viewers cannot enable sharing", ctx do
    ctx = ctx |> Factory.add_space_member(:viewer, :space, permissions: :view_access) |> Factory.log_in_person(:viewer)
    assert {403, _} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
    assert Repo.get!(Document, ctx.document.id).public_token == nil
  end

  test "editors can manage sharing", ctx do
    ctx = ctx |> Factory.add_space_member(:editor, :space, permissions: :edit_access) |> Factory.log_in_person(:editor)
    assert {200, _} = mutation(ctx.conn, [:documents, :update_public_sharing], inputs(ctx, true))
  end

  test "members of another company cannot manage sharing", ctx do
    other = ctx |> Factory.setup() |> Factory.log_in_person(:creator)
    assert {404, _} = mutation(other.conn, [:documents, :update_public_sharing], inputs(ctx, true))
  end

  defp inputs(ctx, enabled), do: %{document_id: Paths.document_id(ctx.document), enabled: enabled}
end
