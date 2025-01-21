defmodule OperatelyWeb.Api.Mutations.PublishResourceHubDocumentTest do
  import Ecto.Query, only: [from: 2]
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :publish_resource_hub_document, %{})
    end
  end


  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, state: :draft)
      |> Factory.add_company_member(:user_no_permissions)
      |> Factory.add_space_member(:user_view_access, :space)
    end

    test "User has no permissions", ctx do
      ctx = Factory.log_in_person(ctx, :user_no_permissions)

      assert {404, res} = mutation(ctx.conn, :publish_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document)
      })
      assert res == %{ error: "Not found", message: "The requested resource was not found" }
    end

    test "User has view access", ctx do
      ctx = Factory.log_in_person(ctx, :user_view_access)

      assert {403, res} = mutation(ctx.conn, :publish_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document)
      })
      assert res == %{ error: "Forbidden", message: "You don't have permission to perform this action" }
    end

    test "User has permissions", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, :publish_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document)
      })
      document = Repo.reload(ctx.document) |> Repo.preload(:node)

      assert res.document == Serializer.serialize(document)
    end
  end

  describe "publish_resource_hub_document functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, state: :draft)
    end

    test "published draft document", ctx do
      assert ctx.document.state == :draft

      assert {200, res} = mutation(ctx.conn, :publish_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document)
      })
      document = Repo.reload(ctx.document) |> Repo.preload(:node)

      assert document.state == :published
      assert res.document == Serializer.serialize(document)
    end

    test "activity is created", ctx do
      refute get_activity(ctx.document)

      assert {200, _} = mutation(ctx.conn, :publish_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document)
      })

      assert get_activity(ctx.document)
    end
  end

  #
  # Helpers
  #

  defp get_activity(document) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(document.id)

    from(a in Operately.Activities.Activity,
      where: a.action == "resource_hub_document_created" and a.content["document_id"] == ^id
    )
    |> Repo.one()
  end
end
