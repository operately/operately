defmodule Operately.SiteMessagesTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.SiteMessages
  alias Operately.SiteMessages.SiteMessage
  alias Operately.Support.RichText

  import Operately.CompaniesFixtures

  describe "list_active_for_company/1" do
    setup do
      company = company_fixture()
      other_company = company_fixture()
      {:ok, company: company, other_company: other_company}
    end

    test "returns active all-companies messages in insertion order", ctx do
      {:ok, first} =
        SiteMessages.create(%{
          title: "First",
          description: RichText.rich_text("First body"),
          all_companies: true,
          active: true
        })

      {:ok, second} =
        SiteMessages.create(%{
          title: "Second",
          description: RichText.rich_text("Second body"),
          all_companies: true,
          active: true
        })

      assert [^first, ^second] = SiteMessages.list_active_for_company(ctx.company)
    end

    test "excludes inactive and expired messages", ctx do
      {:ok, active} =
        SiteMessages.create(%{
          title: "Active",
          description: RichText.rich_text("Still visible"),
          all_companies: true,
          active: true
        })

      assert {:ok, _} =
               SiteMessages.create(%{
                 title: "Inactive",
                 description: RichText.rich_text("Hidden"),
                 all_companies: true,
                 active: false
               })

      assert {:ok, _} =
               SiteMessages.create(%{
                 title: "Expired",
                 description: RichText.rich_text("Hidden"),
                 all_companies: true,
                 active: true,
                 expires_at: DateTime.add(DateTime.utc_now(), -60, :second)
               })

      assert [^active] = SiteMessages.list_active_for_company(ctx.company)
    end

    test "returns targeted messages only for selected companies", ctx do
      {:ok, targeted} =
        SiteMessages.create(%{
          title: "Targeted",
          description: RichText.rich_text("Only for one company"),
          all_companies: false,
          active: true,
          company_ids: [OperatelyWeb.Paths.company_id(ctx.company)]
        })

      assert {:ok, _} =
               SiteMessages.create(%{
                 title: "Other company only",
                 description: RichText.rich_text("Hidden here"),
                 all_companies: false,
                 active: true,
                 company_ids: [OperatelyWeb.Paths.company_id(ctx.other_company)]
               })

      messages = SiteMessages.list_active_for_company(ctx.company)
      assert length(messages) == 1
      assert hd(messages).id == targeted.id

      other_messages = SiteMessages.list_active_for_company(ctx.other_company)
      assert length(other_messages) == 1
      assert hd(other_messages).title == "Other company only"
    end
  end

  describe "create/1 and update/2" do
    setup do
      company = company_fixture()
      {:ok, company: company}
    end

    test "allows specific targeting with no companies selected", _ctx do
      assert {:ok, message} =
               SiteMessages.create(%{
                 title: "Draft audience",
                 description: RichText.rich_text("No companies selected yet"),
                 all_companies: false,
                 active: true,
                 company_ids: []
               })

      assert message.all_companies == false
      assert message.company_ids == []
    end

    test "stores selected companies for targeted messages", ctx do
      assert {:ok, message} =
               SiteMessages.create(%{
                 title: "Targeted",
                 description: RichText.rich_text("For one company"),
                 all_companies: false,
                 active: true,
                 company_ids: [OperatelyWeb.Paths.company_id(ctx.company)]
               })

      assert message.company_ids == [OperatelyWeb.Paths.company_id(ctx.company)]
    end

    test "updates audience associations", ctx do
      other_company = company_fixture()

      {:ok, message} =
        SiteMessages.create(%{
          title: "Original",
          description: RichText.rich_text("Original body"),
          all_companies: false,
          active: true,
          company_ids: [OperatelyWeb.Paths.company_id(ctx.company)]
        })

      assert {:ok, updated} =
               SiteMessages.update(message, %{
                 all_companies: false,
                 company_ids: [OperatelyWeb.Paths.company_id(other_company)]
               })

      assert updated.company_ids == [OperatelyWeb.Paths.company_id(other_company)]
      assert [] = SiteMessages.list_active_for_company(ctx.company)
      assert [_] = SiteMessages.list_active_for_company(other_company)
    end

    test "delete/1 removes the message", _ctx do
      {:ok, message} =
        SiteMessages.create(%{
          title: "Temporary",
          description: RichText.rich_text("Gone soon"),
          all_companies: true,
          active: true
        })

      assert {:ok, _} = SiteMessages.delete(message)
      refute Repo.get(SiteMessage, message.id)
    end
  end
end
