defmodule OperatelyEE.AdminApi.CuratedTemplates.UpdateMetadataTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "changes category, archives, and restores", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true)
      assert {200, %{template: archived, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], Map.merge(identity(ctx.template), %{category: "Sales", archived: true}))
      assert archived.archived_at
      assert archived.category == "Sales"
      assert {200, %{template: restored, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], %{id: archived.id, expected_updated_at: archived.updated_at, archived: false})
      assert restored.archived_at == nil
    end

    test "rejects stale metadata changes", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      inputs = Map.merge(identity(ctx.template), %{category: "Sales"})
      assert {200, _} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], inputs)
      assert {400, %{details: %{reason: "template_conflict"}}} = admin_mutation(ctx.conn, [:curated_templates, :update_metadata], inputs)
    end
  end

  defp identity(template), do: %{id: Paths.curated_template_id(template), expected_updated_at: DateTime.to_iso8601(template.updated_at)}
end
