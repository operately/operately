defmodule Operately.Data.Change010CreateGroupsAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change010CreateGroupsAccessContext

  setup do
    company = company_fixture()

    {:ok, company: company}
  end

  test "creates access_context for existing groups", ctx do
    groups = Enum.map(1..5, fn _ ->
      {:ok, group} = create_group(ctx.company.id)
      group
    end)

    Enum.each(groups, fn group ->
      assert nil == Repo.get_by(Context, group_id: group.id)
    end)

    Change010CreateGroupsAccessContext.run()

    Enum.each(groups, fn group ->
      assert %Context{} = Repo.get_by(Context, group_id: group.id)
    end)
  end

  def create_group(company_id) do
    Operately.Groups.Group.changeset(%{
      company_id: company_id,
      name: "some name",
      mission: "some mission",
      icon: "some icon",
      color: "come color",
    })
    |> Repo.insert()
  end
end
