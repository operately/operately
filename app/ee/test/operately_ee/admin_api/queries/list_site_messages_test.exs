defmodule OperatelyEE.AdminApi.Queries.ListSiteMessagesTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.SiteMessages
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_site_messages, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :list_site_messages, %{})
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

    test "returns all site messages", ctx do
      description = RichText.rich_text("Scheduled downtime tonight")

      {:ok, message} =
        SiteMessages.create(%{
          title: "Maintenance",
          description: description,
          all_companies: true,
          active: true
        })

      assert {200, %{messages: [returned]}} = admin_query(ctx.conn, :list_site_messages, %{})
      assert returned.id == OperatelyWeb.Paths.site_message_id(message)
      assert returned.title == "Maintenance"
      assert Jason.decode!(returned.description) == description
      assert returned.all_companies == true
      assert returned.active == true
    end

    test "returns an empty list when no messages exist", ctx do
      assert {200, %{messages: []}} = admin_query(ctx.conn, :list_site_messages, %{})
    end
  end
end
