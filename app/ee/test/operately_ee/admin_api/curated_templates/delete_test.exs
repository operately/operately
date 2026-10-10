defmodule OperatelyEE.AdminApi.CuratedTemplates.DeleteTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :delete], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :delete], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "deletes templates regardless of publication state", ctx do
      for opts <- [[], [published: true]] do
        ctx = Factory.add_curated_template(ctx, :template, opts)
        assert {200, %{template: deleted, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :delete], identity(ctx.template))
        assert deleted.id == Paths.curated_template_id(ctx.template)
        assert Operately.CuratedTemplates.get(ctx.template.id) == nil
      end
    end

    test "rejects stale deletion requests", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true)
      {:ok, updated} = Operately.Operations.CuratedTemplateUpdating.run(ctx.template, ctx.account, ctx.template.updated_at, {:update, %{title: "Updated"}})
      assert {400, %{details: %{reason: "template_conflict"}}} = admin_mutation(ctx.conn, [:curated_templates, :delete], identity(ctx.template))
      assert Operately.CuratedTemplates.get(updated.id).title == "Updated"
    end

    test "returns not found for a missing template", ctx do
      assert {404, _} = admin_mutation(ctx.conn, [:curated_templates, :delete], %{id: Operately.ShortUuid.generate(), expected_updated_at: DateTime.to_iso8601(DateTime.utc_now())})
    end
  end

  defp identity(template), do: %{id: Paths.curated_template_id(template), expected_updated_at: DateTime.to_iso8601(template.updated_at)}
end
