defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateContributorTest do
  use Operately.DataCase, async: true

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.Person
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateContributor
  alias OperatelyWeb.Paths

  setup do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_company_member(:other)
      |> Factory.add_company_member(:replacement)
      |> Factory.add_project_template_person(:template_person, :template, :other,
        responsibility: "Lead",
        access_level: Binding.edit_access()
      )

    {:ok, ctx: ctx}
  end

  test "call/2 updates responsibility and access level", %{ctx: ctx} do
    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "responsibility" => "Delivery",
               "access_level" => "comment_access"
             })

    db_person = Operately.Repo.get!(Person, ctx.template_person.id)

    assert contributor.responsibility == "Delivery"
    assert db_person.responsibility == "Delivery"
    assert db_person.access_level == Binding.comment_access()
    assert db_person.role == :contributor
  end

  test "call/2 clears responsibility with null", %{ctx: ctx} do
    assert {:ok, %{contributor: _contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "responsibility" => nil
             })

    assert Operately.Repo.get!(Person, ctx.template_person.id).responsibility == nil
  end

  test "call/2 leaves omitted fields unchanged", %{ctx: ctx} do
    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "responsibility" => "Updated only"
             })

    db_person = Operately.Repo.get!(Person, ctx.template_person.id)

    assert contributor.responsibility == "Updated only"
    assert db_person.responsibility == "Updated only"
    assert db_person.access_level == Binding.edit_access()
    assert db_person.role == :contributor
  end

  test "call/2 promotes to reviewer and forces full access", %{ctx: ctx} do
    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "role" => "reviewer",
               "access_level" => "comment_access"
             })

    db_person = Operately.Repo.get!(Person, ctx.template_person.id)

    assert contributor.role == :reviewer
    assert db_person.role == :reviewer
    assert db_person.access_level == Binding.full_access()
  end

  test "call/2 demotes the previous champion when promoting another person", %{ctx: ctx} do
    ctx =
      Factory.add_project_template_person(ctx, :champion, :template, :creator,
        role: :champion,
        access_level: Binding.full_access()
      )

    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.champion),
               "person_id" => Paths.person_id(ctx.other),
               "role" => "champion"
             })

    assert contributor.id == Paths.project_template_person_id(ctx.template_person)
    assert contributor.role == :champion
    assert contributor.access_level == Binding.full_access()
    assert Operately.Repo.reload!(ctx.champion).role == :contributor
  end

  test "call/2 replaces the company person on the contributor", %{ctx: ctx} do
    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "person_id" => Paths.person_id(ctx.replacement)
             })

    db_person = Operately.Repo.get!(Person, ctx.template_person.id)

    assert contributor.id == Paths.project_template_person_id(ctx.template_person)
    assert db_person.person_id == ctx.replacement.id
    assert db_person.responsibility == "Lead"
    assert db_person.access_level == Binding.edit_access()
  end

  test "call/2 returns not_found when the contributor belongs to another template", %{ctx: ctx} do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_person(:foreign, :other_template, :replacement)

    assert {:error, :not_found} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.foreign),
               "responsibility" => "Nope"
             })

    assert Operately.Repo.reload!(ctx.template_person).responsibility == "Lead"
  end

  test "call/2 returns not_found when the feature is disabled", %{ctx: ctx} do
    ctx = Factory.disable_feature(ctx, "project_templates")

    assert {:error, :not_found} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "responsibility" => "Nope"
             })

    assert Operately.Repo.reload!(ctx.template_person).responsibility == "Lead"
  end

  test "call/2 returns invalid_arguments for an unknown role", %{ctx: ctx} do
    assert {:error, :invalid_arguments} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "role" => "owner"
             })
  end

  test "call/2 returns invalid_arguments for an unknown access level", %{ctx: ctx} do
    assert {:error, :invalid_arguments} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person),
               "access_level" => "super_access"
             })
  end
end
