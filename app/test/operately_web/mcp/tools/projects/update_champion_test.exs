defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateChampionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateChampion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project champion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "champion_id" => Paths.person_id(ctx.coworker)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.coworker.id
  end

  test "call/2 clears the project champion when champion_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, champion: :coworker)

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.coworker.id

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion == nil
  end

  test "call/2 rejects a champion from another company" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    other = Factory.setup(%{})

    assert {:error, :bad_request} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "champion_id" => Paths.person_id(other.creator)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.creator.id
  end

  test "call/2 rejects the caller's person record from another company" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    ctx = Factory.add_company(ctx, :other_company, ctx.account, name: "Other Co")

    foreign_person = Operately.People.get_person!(ctx.account, ctx.other_company)

    assert {:error, :bad_request} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "champion_id" => Paths.person_id(foreign_person)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.creator.id
  end

  test "call/2 accepts an active guest" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:guest)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, ctx.guest)

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "champion_id" => Paths.person_id(guest)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == guest.id
  end

  test "call/2 does not update a project outside the caller company" do
    ctx = Factory.setup(%{})
    other = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    before = ToolConnHelper.reload(other.project, :champion).champion.id

    assert {:error, :not_found, _} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(other.project),
               "champion_id" => Paths.person_id(ctx.creator)
             })

    assert ToolConnHelper.reload(other.project, :champion).champion.id == before
  end
end
