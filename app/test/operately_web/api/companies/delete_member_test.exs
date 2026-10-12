defmodule OperatelyWeb.Api.Companies.DeleteMemberTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:companies, :delete_member], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :view_access,    expected: 403},
      %{company: :comment_access, expected: 403},
      %{company: :edit_access,    expected: 403},
      %{company: :full_access,    expected: 200},
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "if caller has levels company=#{@test.company}, then expect code=#{@test.expected}", ctx do
        set_caller_access_level(ctx, @test.company)
        member = person_fixture_with_account(%{company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})

        assert code == @test.expected

        case @test.expected do
          200 -> assert res.person.id == Paths.person_id(member)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "remove_company_member functionality" do
    setup :register_and_log_in_account

    test "admin can remove members with open invitations", ctx do
      set_caller_access_level(ctx, :full_access)
      member = person_fixture_with_account(%{company_id: ctx.company.id})

      assert {200, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})

      assert Repo.get(Operately.People.Person, member.id) == nil
      assert res.person.id == Paths.person_id(member)
    end

    test "admin can remove members who have no title", ctx do
      set_caller_access_level(ctx, :full_access)
      member = person_fixture_with_account(%{company_id: ctx.company.id, title: nil, has_open_invitation: false})

      assert {200, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})

      member = Repo.get(Operately.People.Person, member.id)

      assert member.suspended
      assert res.person.id == Paths.person_id(member)
    end

    test "admin can remove members with used accounts", ctx do
      set_caller_access_level(ctx, :full_access)
      member = person_fixture_with_account(%{company_id: ctx.company.id, has_open_invitation: false})

      assert {200, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})
      member = Repo.get(Operately.People.Person, member.id) |> Repo.preload(:account)

      assert member.suspended
      assert member.suspended_at
      assert res.person == Serializer.serialize(member)
    end

    test "admin can remove members who are already suspended", ctx do
      set_caller_access_level(ctx, :full_access)
      member = person_fixture_with_account(%{company_id: ctx.company.id, has_open_invitation: false})
      {:ok, member} = Operately.People.update_person(member, %{suspended: true, suspended_at: DateTime.utc_now()})

      assert {200, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})

      member = Repo.get(Operately.People.Person, member.id)

      assert member.suspended
      assert res.person.id == Paths.person_id(member)
    end
  end

  describe "company boundary" do
    import Ecto.Query, only: [from: 2]

    alias Operately.Access.Binding
    alias Operately.Access.Group
    alias Operately.Access.GroupMembership
    alias Operately.Activities.Activity
    alias Operately.InviteLinks.InviteLink
    alias Operately.People.Account
    alias Operately.People.Person

    setup :register_and_log_in_account

    setup ctx do
      set_caller_access_level(ctx, :full_access)
      {:ok, Map.put(ctx, :foreign, Factory.setup(%{}))}
    end

    test "it rejects suspending a member of another company", ctx do
      member = person_fixture_with_account(%{company_id: ctx.foreign.company.id, has_open_invitation: false})

      before = snapshot(member)

      assert {404, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})
      assert res.message == "The requested resource was not found"

      assert snapshot(member) == before
    end

    test "it rejects deleting an open invitation of another company", ctx do
      {:ok, changes} =
        Operately.Operations.CompanyMemberAdding.run(ctx.foreign.creator, ctx.foreign.company, %{
          full_name: "Invited Member",
          email: unique_account_email(),
          title: "Engineer"
        })

      member = changes.person

      before = snapshot(member)

      assert {404, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(member)})
      assert res.message == "The requested resource was not found"

      assert snapshot(member) == before
      assert snapshot(member).invite_links == 1
      assert snapshot(member).account.first_login_at == nil
    end

    test "it rejects a foreign person record whose account also belongs to the caller's company", ctx do
      account = account_fixture()
      person_fixture(%{company_id: ctx.company.id, account_id: account.id, email: account.email})
      foreign_record = person_fixture(%{company_id: ctx.foreign.company.id, account_id: account.id, email: account.email})

      before = snapshot(foreign_record)

      assert {404, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: Paths.person_id(foreign_record)})
      assert res.message == "The requested resource was not found"

      assert snapshot(foreign_record) == before
    end

    test "it rejects a missing person", ctx do
      missing_id = Operately.ShortUuid.encode!(Ecto.UUID.generate())

      assert {404, res} = mutation(ctx.conn, [:companies, :delete_member], %{person_id: missing_id})
      assert res.message == "The requested resource was not found"
    end

    #
    # Helpers
    #

    # Snapshots everything a rejection must leave untouched: the person
    # record, the account and its open invitation, access group
    # memberships, access bindings, invite links, and removal activities.
    defp snapshot(person) do
      reloaded = Repo.get(Person, person.id)

      %{
        person: reloaded && Map.take(reloaded, [:suspended, :suspended_at]),
        account: account_snapshot(reloaded),
        memberships: Repo.aggregate(from(m in GroupMembership, where: m.person_id == ^person.id), :count),
        bindings: bindings_count(person),
        invite_links: Repo.aggregate(from(l in InviteLink, where: l.person_id == ^person.id), :count),
        removal_activities: Repo.aggregate(from(a in Activity, where: a.action == "company_member_removed"), :count)
      }
    end

    defp account_snapshot(nil), do: nil

    defp account_snapshot(person) do
      case Repo.get(Account, person.account_id) do
        nil -> nil
        account -> %{first_login_at: account.first_login_at, deleted_at: account.deleted_at}
      end
    end

    defp bindings_count(person) do
      case Repo.get_by(Group, person_id: person.id) do
        nil -> 0
        group -> Repo.aggregate(from(b in Binding, where: b.group_id == ^group.id), :count)
      end
    end
  end

  #
  # Helpers
  #

  defp set_caller_access_level(ctx, access_level) do
    if access_level == :full_access do
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)
    end
  end
end
