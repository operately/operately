defmodule OperatelyEE.AdminApi.CuratedTemplates.GetTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, [:curated_templates, :get], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_query(ctx.conn, [:curated_templates, :get], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "returns draft details and resolves links after renaming", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      id = Paths.curated_template_id(ctx.template)
      {:ok, _} = Operately.Operations.CuratedTemplateUpdating.run(ctx.template, ctx.account, ctx.template.updated_at, {:update, %{title: "Renamed"}})
      assert {200, %{template: returned}} = admin_query(ctx.conn, [:curated_templates, :get], %{id: id})
      assert returned.title == "Renamed"
      assert returned.state == "draft"
      assert Jason.decode!(returned.definition)["name"] == "Revenue"
    end

    test "accepts UUIDs and encoded IDs", ctx do
      ctx = Factory.add_curated_template(ctx, :template)

      for id <- [ctx.template.id, Operately.ShortUuid.encode!(ctx.template.id), Paths.curated_template_id(ctx.template)] do
        assert {200, %{template: returned}} = admin_query(ctx.conn, [:curated_templates, :get], %{id: id})
        assert returned.id == Paths.curated_template_id(ctx.template)
      end
    end

    test "missing templates return not found", ctx do
      assert {404, _} = admin_query(ctx.conn, [:curated_templates, :get], %{id: Operately.ShortUuid.generate()})
    end

    test "malformed IDs use standard API input validation", ctx do
      for id <- ["not-valid!", String.duplicate("9", 22)] do
        assert {404, _} = admin_query(ctx.conn, [:curated_templates, :get], %{id: id})
      end
    end
  end
end
