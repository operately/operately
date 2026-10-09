defmodule OperatelyEE.AdminApi.CuratedTemplates.UpdateTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "updates a draft and rejects stale editors", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      inputs = Map.merge(payload(:kpi), %{id: Paths.curated_template_id(ctx.template), expected_updated_at: DateTime.to_iso8601(ctx.template.updated_at), title: "Edited"})
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert template.title == "Edited"
      assert {400, %{details: %{reason: "template_conflict"}}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
    end

    test "valid published edits are live; invalid edits leave content unchanged", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true)
      inputs = Map.merge(payload(:kpi), %{id: Paths.curated_template_id(ctx.template), expected_updated_at: DateTime.to_iso8601(ctx.template.updated_at), definition: "{}"})
      assert {200, %{template: nil, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert errors != []
      assert Operately.CuratedTemplates.get(ctx.template.id).definition["name"] == "Revenue"
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], %{inputs | definition: payload(:kpi).definition, title: "Live"})
      assert template.state == "published"
      assert template.title == "Live"
    end
  end

  defp payload(type) do
    %{title: "Example", type: Atom.to_string(type), content_language: "en", definition: Jason.encode!(Operately.Support.Factory.CuratedTemplates.definition(type))}
  end
end
