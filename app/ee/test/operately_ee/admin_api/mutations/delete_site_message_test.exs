defmodule OperatelyEE.AdminApi.Mutations.DeleteSiteMessageTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.SiteMessages
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :delete_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate())
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :delete_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate())
               })
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "deletes a site message", ctx do
      {:ok, message} =
        SiteMessages.create(%{
          title: "Temporary",
          description: RichText.rich_text("Gone soon"),
          all_companies: true,
          active: true
        })

      assert {200, %{success: true}} =
               admin_mutation(ctx.conn, :delete_site_message, %{
                 id: OperatelyWeb.Paths.site_message_id(message)
               })

      assert SiteMessages.get(message.id) == nil
    end

    test "returns not found for a missing message", ctx do
      assert {404, _} =
               admin_mutation(ctx.conn, :delete_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate())
               })
    end

    test "returns bad request for an invalid id", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :delete_site_message, %{
                 id: "not-a-valid-id"
               })
    end
  end
end
