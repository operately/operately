defmodule OperatelyEE.AdminApi.Mutations.UpdateSiteMessageTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.SiteMessages
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
                 title: "Updated"
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
                 title: "Updated"
               })
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      {:ok, message} =
        SiteMessages.create(%{
          title: "Original",
          description: RichText.rich_text("Original body"),
          all_companies: true,
          active: true
        })

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
      |> Map.put(:site_message, message)
    end

    test "updates a site message", ctx do
      description = RichText.rich_text("Updated body")

      assert {200, %{message: message}} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: OperatelyWeb.Paths.site_message_id(ctx.site_message),
                 title: "Updated title",
                 description: Jason.encode!(description),
                 active: false
               })

      assert message.title == "Updated title"
      assert Jason.decode!(message.description) == description
      assert message.active == false
    end

    test "updates audience targeting", ctx do
      assert {200, %{message: message}} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: OperatelyWeb.Paths.site_message_id(ctx.site_message),
                 all_companies: false,
                 company_ids: [OperatelyWeb.Paths.company_id(ctx.company)]
               })

      assert message.all_companies == false
      assert message.company_ids == [OperatelyWeb.Paths.company_id(ctx.company)]
    end

    test "returns not found for a missing message", ctx do
      assert {404, _} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: Operately.ShortUuid.encode!(Ecto.UUID.generate()),
                 title: "Updated"
               })
    end

    test "returns bad request for an invalid id", ctx do
      assert {400, _} =
               admin_mutation(ctx.conn, :update_site_message, %{
                 id: "not-a-valid-id",
                 title: "Updated"
               })
    end
  end
end
