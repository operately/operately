defmodule OperatelyEE.AdminApi.Mutations.CreateSiteMessageTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :create_site_message, %{
                 title: "Hello",
                 description: RichText.rich_text("World", :as_string),
                 all_companies: true,
                 active: true
               })
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :create_site_message, %{
                 title: "Hello",
                 description: RichText.rich_text("World", :as_string),
                 all_companies: true,
                 active: true
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

    test "creates a site message", ctx do
      description = RichText.rich_text("Scheduled downtime")

      assert {200, %{message: message}} =
               admin_mutation(ctx.conn, :create_site_message, %{
                 title: "Maintenance",
                 description: Jason.encode!(description),
                 all_companies: true,
                 active: true
               })

      assert message.title == "Maintenance"
      assert Jason.decode!(message.description) == description
      assert message.all_companies == true
      assert message.active == true
    end

    test "creates a targeted site message", ctx do
      assert {200, %{message: message}} =
               admin_mutation(ctx.conn, :create_site_message, %{
                 title: "Targeted",
                 description: RichText.rich_text("Only one company", :as_string),
                 all_companies: false,
                 active: true,
                 company_ids: [OperatelyWeb.Paths.company_id(ctx.company)]
               })

      assert message.all_companies == false
      assert message.company_ids == [OperatelyWeb.Paths.company_id(ctx.company)]
    end
  end
end
