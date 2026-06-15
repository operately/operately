defmodule OperatelyWeb.Api.SiteMessages.ListActiveTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.SiteMessages
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = query(ctx.conn, [:site_messages, :list_active], %{})
    end

    test "it rejects a non-member", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:outsider)
        |> Factory.log_in_account(:outsider)

      assert {404, _} = query(ctx.conn, [:site_messages, :list_active], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.set_company_access_level(:member, Binding.minimal_access())
        |> Factory.log_in_person(:member)

      {:ok, ctx}
    end

    test "it returns active messages for the current company", ctx do
      description = RichText.rich_text("Scheduled downtime tonight")

      {:ok, message} =
        SiteMessages.create(%{
          title: "Maintenance",
          description: description,
          all_companies: true,
          active: true
        })

      assert {200, %{messages: [returned]}} = query(ctx.conn, [:site_messages, :list_active], %{})
      assert returned.id == OperatelyWeb.Paths.site_message_id(message)
      assert returned.title == "Maintenance"
      assert Jason.decode!(returned.description) == description
    end

    test "it returns an empty list when no messages are active", ctx do
      assert {200, %{messages: []}} = query(ctx.conn, [:site_messages, :list_active], %{})
    end
  end
end
