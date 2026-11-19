defmodule OperatelyWeb.Mcp.Tools.Companies.InviteGuestTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Companies.InviteGuest, as: Tool

  test "invites into the connected company and preserves role checks" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member)
    args = %{"full_name" => "Alex", "title" => "Designer", "email" => "invite-#{Ecto.UUID.generate()}@example.com"}
    assert {:error, :forbidden} = Tool.call(ToolConnHelper.conn_as(ctx, :member), args)
    assert {:ok, %{person_id: id, new_account: true, invite_link: link}} = Tool.call(ToolConnHelper.conn(ctx), args)
    person = Repo.get!(Operately.People.Person, ToolConnHelper.decode_id!(id))
    assert person.company_id == ctx.company.id
    assert person.type == :guest
    assert link.token
  end
end
