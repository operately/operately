defmodule OperatelyEE.AdminApi.CuratedTemplates.PublishTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :publish], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :publish], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "publishes a complete saved draft", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :publish], identity(ctx.template))
      assert template.state == "published"
      assert template.published_at
      assert {400, %{details: %{reason: "template_conflict"}}} = admin_mutation(ctx.conn, [:curated_templates, :publish], identity(ctx.template))
    end

    test "incomplete drafts remain private", ctx do
      ctx = Factory.add_curated_template(ctx, :template, definition: %{})
      assert {200, %{template: nil, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :publish], identity(ctx.template))
      assert errors != []
      assert Operately.CuratedTemplates.get(ctx.template.id).state == :draft
    end
  end

  defp identity(template), do: %{id: Paths.curated_template_id(template), expected_updated_at: DateTime.to_iso8601(template.updated_at)}
end
