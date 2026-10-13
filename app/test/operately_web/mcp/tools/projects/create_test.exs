defmodule OperatelyWeb.Mcp.Tools.Projects.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Project
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Create
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a project in a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{project: project}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Project",
               "description" => "Initial project description"
             })

    project = Operately.Repo.get!(Project, ToolConnHelper.decode_id!(project.id))

    assert project.name == "MCP Project"
    assert project.group_id == ctx.space.id
    assert ToolConnHelper.rich_text_to_string(project.description) == "Initial project description"
  end

  test "call/2 creates a project with only required params" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{project: project}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Project"
             })

    project =
      Project
      |> Operately.Repo.get!(ToolConnHelper.decode_id!(project.id))
      |> Operately.Repo.preload([:champion, :reviewer])

    assert project.name == "MCP Project"
    assert project.group_id == ctx.space.id
    assert is_nil(project.description)
    assert is_nil(project.goal_id)
    assert project.champion == nil
    assert project.reviewer == nil
  end

  test "call/2 rejects a foreign champion without creating a project" do
    ctx = space_context()
    other = Factory.setup(%{})

    assert_unchanged(fn ->
      assert {:error, :bad_request} =
               Create.call(ToolConnHelper.conn(ctx), %{
                 "space_id" => Paths.space_id(ctx.space),
                 "name" => "Foreign champion",
                 "champion_id" => Paths.person_id(other.creator)
               })
    end)
  end

  test "call/2 rejects a mixed owner batch and a same-account foreign person" do
    ctx = space_context()
    other = Factory.setup(%{})
    ctx = Factory.add_company(ctx, :other_company, ctx.account)

    foreign_person =
      Operately.Repo.get_by!(Operately.People.Person, company_id: ctx.other_company.id, account_id: ctx.account.id)

    assert_unchanged(fn ->
      assert {:error, :bad_request} =
               Create.call(ToolConnHelper.conn(ctx), %{
                 "space_id" => Paths.space_id(ctx.space),
                 "name" => "Mixed owners",
                 "champion_id" => Paths.person_id(ctx.creator),
                 "reviewer_id" => Paths.person_id(other.creator)
               })

      assert {:error, :bad_request} =
               Create.call(ToolConnHelper.conn(ctx), %{
                 "space_id" => Paths.space_id(ctx.space),
                 "name" => "Same account",
                 "reviewer_id" => Paths.person_id(foreign_person)
               })
    end)
  end

  test "call/2 accepts an active guest who cannot access the destination" do
    ctx = space_context() |> Factory.add_company_member(:guest_member)
    {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, ctx.guest_member)

    assert {:error, :not_found} = Operately.Groups.Group.get(guest, id: ctx.space.id)

    assert {:ok, %{project: project}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "Guest champion",
               "champion_id" => Paths.person_id(guest)
             })

    project =
      Operately.Projects.Project
      |> Operately.Repo.get!(ToolConnHelper.decode_id!(project.id))
      |> Operately.Repo.preload(:contributors)

    assert Enum.find(project.contributors, &(&1.role == :champion)).person_id == guest.id
  end

  test "call/2 rejects a destination from another company" do
    ctx = space_context()
    other = Factory.setup(%{})

    assert_unchanged(fn ->
      assert {:error, :not_found} =
               Create.call(ToolConnHelper.conn(ctx), %{
                 "space_id" => Paths.space_id(other.company.company_space_id),
                 "name" => "Foreign space"
               })
    end)
  end

  defp space_context do
    %{}
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  defp assert_unchanged(fun) do
    before = resource_snapshot()
    fun.()
    assert resource_snapshot() == before
  end

  defp resource_snapshot do
    [
      Operately.Projects.Project,
      Operately.Projects.Contributor,
      Operately.Access.Binding,
      Operately.Groups.Member,
      Operately.Notifications.Subscription,
      Operately.Activities.Activity
    ]
    |> Enum.map(&Operately.Repo.aggregate(&1, :count))
  end
end
