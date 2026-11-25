defmodule Operately.SiteMessagesTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.SiteMessages
  alias Operately.SiteMessages.SiteMessage
  alias Operately.Support.RichText

  import Operately.CompaniesFixtures

  describe "list_all/0" do
    test "uses a bounded number of SELECT queries as targeted messages grow" do
      company = company_fixture()
      company_id = OperatelyWeb.Paths.company_id(company)

      create_message("First", company_ids: [company_id])
      assert {[_], 2} = measured_list_all()

      create_message("Second", company_ids: [])
      create_message("Third", company_ids: [company_id])
      assert {messages, 2} = measured_list_all()
      assert length(messages) == 3
    end

    test "skips the audience query for empty and global-only lists" do
      assert {[], 1} = measured_list_all()
      assert {[], 0} = measured_load_company_ids([])

      create_message("Global", all_companies: true)
      assert {[message], 1} = measured_list_all()
      assert message.company_ids == []
    end

    test "preserves message order and groups audiences in company name order" do
      zulu = company_fixture(%{company_name: "Zulu"})
      alpha = company_fixture(%{company_name: "Alpha"})
      zulu_id = OperatelyWeb.Paths.company_id(zulu)
      alpha_id = OperatelyWeb.Paths.company_id(alpha)

      oldest = create_message("Oldest", company_ids: [zulu_id, alpha_id])
      middle = create_message("Middle", company_ids: [zulu_id])
      empty = create_message("Empty", company_ids: [])
      global = create_message("Global", all_companies: true)

      for {message, seconds_ago} <- [{oldest, 40}, {middle, 30}, {empty, 20}, {global, 10}] do
        from(m in SiteMessage, where: m.id == ^message.id)
        |> Repo.update_all(set: [inserted_at: DateTime.add(DateTime.utc_now(), -seconds_ago, :second)])
      end

      assert [loaded_global, loaded_empty, loaded_middle, loaded_oldest] = SiteMessages.list_all()

      assert Enum.map([loaded_global, loaded_empty, loaded_middle, loaded_oldest], & &1.id) ==
               Enum.map([global, empty, middle, oldest], & &1.id)

      assert loaded_global.company_ids == []
      assert loaded_empty.company_ids == []
      assert loaded_middle.company_ids == [zulu_id]
      assert loaded_oldest.company_ids == [alpha_id, zulu_id]

      assert SiteMessages.load_company_ids(oldest).company_ids == loaded_oldest.company_ids
      assert {loaded_global, 0} = measured_load_company_ids(global)
      assert loaded_global.company_ids == []
    end
  end

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

    test "keeps the targeted audience when company_ids are omitted from an update", ctx do
      company_id = OperatelyWeb.Paths.company_id(ctx.company)
      message = create_message("Targeted", company_ids: [company_id])

      assert {:ok, updated} = SiteMessages.update(message, %{title: "Renamed"})
      assert updated.company_ids == [company_id]
      assert SiteMessages.load_company_ids(Repo.get!(SiteMessage, message.id)).company_ids == [company_id]
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

  defp create_message(title, attrs) do
    attrs = Map.new(attrs)

    {:ok, message} =
      SiteMessages.create(%{
        title: title,
        description: RichText.rich_text("Message body"),
        all_companies: Map.get(attrs, :all_companies, false),
        active: true,
        company_ids: Map.get(attrs, :company_ids, [])
      })

    message
  end

  defp measured_list_all, do: measure_select_queries(&SiteMessages.list_all/0)
  defp measured_load_company_ids(messages), do: measure_select_queries(fn -> SiteMessages.load_company_ids(messages) end)

  defp measure_select_queries(fun) do
    handler_id = {__MODULE__, make_ref()}
    caller = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _, _, metadata, _ ->
        if self() == caller and String.starts_with?(metadata.query, "SELECT") do
          send(caller, {:select_query, handler_id})
        end
      end,
      nil
    )

    try do
      result = fun.()
      {result, count_select_queries(handler_id)}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp count_select_queries(handler_id, count \\ 0) do
    receive do
      {:select_query, ^handler_id} -> count_select_queries(handler_id, count + 1)
    after
      0 -> count
    end
  end
end
