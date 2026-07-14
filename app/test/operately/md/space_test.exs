defmodule Operately.MD.SpaceTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.TasksFixtures

  test "it renders company and members from a bare space struct" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space", mission: "Coordinate roadmap work"})

    raw_space = Repo.get!(Operately.Groups.Group, space.id)
    rendered = Operately.MD.Space.render(raw_space)

    assert rendered =~ "Company: MCP Company"
    assert rendered =~ "Type: Space"
    assert rendered =~ "Members: 1"
    assert rendered =~ "## Members"
    assert rendered =~ "Taylor Creator"
    refute rendered =~ "## Tasks"
  end

  test "it renders loaded company and members without tasks" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    guest = person_fixture(%{company_id: company.id, full_name: "Jordan Guest", type: :guest})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space", mission: "Coordinate roadmap work"})
    Operately.Groups.add_members(creator, space.id, [%{id: guest.id, access_level: Operately.Access.Binding.comment_access()}])
    _task = task_fixture(%{creator_id: creator.id, space_id: space.id, name: "Space Task"})

    rendered = space |> Repo.reload() |> Operately.MD.Space.render()

    assert rendered =~ "Company: MCP Company"
    assert rendered =~ "Type: Space"
    assert rendered =~ "Members: 2"
    assert rendered =~ "Taylor Creator"
    assert rendered =~ "Jordan Guest"
    refute rendered =~ "## Tasks"
    refute rendered =~ "Space Task"
  end
end
