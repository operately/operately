defmodule OperatelyWeb.Api.Spaces.UpdateMembersPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:spaces, :update_members_permissions], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :view_access,    space: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      expected: 200},

      %{company: :no_access,      space: :view_access,    expected: 403},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 403},
      %{company: :no_access,      space: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.from_atom(@test.company))
        add_person_to_space(ctx.person, space.id, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, space, [
          {p1, Binding.edit_access()},
          {p2, Binding.comment_access()},
        ])
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_member_access_level(space, p1, Binding.edit_access())
            assert_member_access_level(space, p2, Binding.comment_access())
          403 ->
            assert res.message == "You don't have permission to perform this action"
            refute_member_access_level(space, p1, Binding.edit_access())
            refute_member_access_level(space, p2, Binding.comment_access())
          404 ->
            assert res.message == "The requested resource was not found"
            refute_member_access_level(space, p1, Binding.edit_access())
            refute_member_access_level(space, p2, Binding.comment_access())
        end
      end
    end
  end

  describe "edit_group functionality" do
    setup :register_and_log_in_account

    test "edits members access level", ctx do
      {space, p1, p2} = create_space_with_members(ctx)

      assert_member_access_level(space, p1, Binding.view_access())
      assert_member_access_level(space, p2, Binding.view_access())

      assert {200, res} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert res.success

      assert_member_access_level(space, p1, Binding.edit_access())
      assert_member_access_level(space, p2, Binding.comment_access())
    end
  end

  describe "company member boundaries" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:creator)
    end

    for invalid_person <- [:other_company, :missing, :suspended, :suspended_at, :same_account] do
      test "rejects #{invalid_person} people without changing state", ctx do
        person_id = invalid_person_id(ctx, unquote(invalid_person))
        refute space_member?(ctx.space, person_id)

        assert_unchanged(fn ->
          assert bad_request_response() == permission_request(ctx, [%{id: person_id, access_level: Binding.edit_access()}])
        end)

        refute person_binding(ctx.space, person_id)
      end
    end

    test "rejects a foreign person who has no destination membership", ctx do
      foreign = Factory.setup(%{}).creator
      refute space_member?(ctx.space, foreign.id)

      assert_unchanged(fn ->
        assert bad_request_response() == permission_request(ctx, [%{id: foreign.id, access_level: Binding.full_access()}])
      end)

      refute person_binding(ctx.space, foreign.id)
    end

    test "rejects a mixed batch before changing the valid member", ctx do
      add_person_to_space(ctx.member, ctx.space.id, Binding.view_access())
      foreign_id = invalid_person_id(ctx, :other_company)

      assert_unchanged(fn ->
        assert bad_request_response() ==
                 permission_request(ctx, [
                   %{id: ctx.member.id, access_level: Binding.edit_access()},
                   %{id: foreign_id, access_level: Binding.comment_access()}
                 ])
      end)

      assert_member_access_level(ctx.space, ctx.member, Binding.view_access())
      refute person_binding(ctx.space, foreign_id)
    end

    test "rejects duplicated foreign people without creating a binding", ctx do
      foreign_id = invalid_person_id(ctx, :other_company)
      refute space_member?(ctx.space, foreign_id)

      assert_unchanged(fn ->
        assert bad_request_response() ==
                 permission_request(ctx, [
                   %{id: foreign_id, access_level: Binding.edit_access()},
                   %{id: foreign_id, access_level: Binding.full_access()}
                 ])
      end)

      refute person_binding(ctx.space, foreign_id)
    end

    test "rejects a foreign-company space even when the caller has a binding and the target has no membership", ctx do
      other = Factory.setup(%{}) |> Factory.add_space(:space)
      caller_group = Access.get_group!(person_id: ctx.creator.id)
      context = Access.get_context!(group_id: other.space.id)

      {:ok, _} =
        Access.create_binding(%{
          group_id: caller_group.id,
          context_id: context.id,
          access_level: Binding.full_access()
        })

      refute space_member?(other.space, ctx.creator.id)
      refute space_member?(other.space, ctx.member.id)
      assert {:ok, _} = Operately.Groups.Group.get(ctx.creator, id: other.space.id)

      assert_unchanged(fn ->
        assert not_found_response() ==
                 permission_request(ctx, [%{id: ctx.member.id, access_level: Binding.edit_access()}], other.space)
      end)

      refute person_binding(other.space, ctx.member.id)
    end

    test "keeps company read-only rejection ahead of membership validation", ctx do
      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      foreign_id = invalid_person_id(ctx, :other_company)

      assert_unchanged(fn ->
        assert {403, _} = permission_request(ctx, [%{id: foreign_id, access_level: Binding.edit_access()}])
      end)
    end

    test "accepts duplicate ids for an active member", ctx do
      add_person_to_space(ctx.member, ctx.space.id, Binding.view_access())

      assert {200, %{success: true}} =
               permission_request(ctx, [
                 %{id: ctx.member.id, access_level: Binding.edit_access()},
                 %{id: ctx.member.id, access_level: Binding.comment_access()}
               ])

      assert_member_access_level(ctx.space, ctx.member, Binding.comment_access())
    end

    test "accepts an empty member list", ctx do
      assert {200, %{success: true}} = permission_request(ctx, [])
    end

    test "updates an active member who is not a space member", ctx do
      refute space_member?(ctx.space, ctx.member.id)

      assert {200, %{success: true}} =
               permission_request(ctx, [%{id: ctx.member.id, access_level: Binding.comment_access()}])

      assert_member_access_level(ctx.space, ctx.member, Binding.comment_access())
    end

    test "accepts an active guest even when caller-scoped lookup cannot see them", ctx do
      ctx = Factory.add_company_member(ctx, :guest_member)
      {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, ctx.guest_member)
      ctx = Factory.add_company_member(ctx, :limited)
      add_person_to_space(ctx.limited, ctx.space.id, Binding.full_access())
      remove_company_visibility(ctx.limited)
      ctx = Factory.log_in_person(ctx, :limited)

      assert guest.type == :guest
      refute space_member?(ctx.space, guest.id)
      assert {:error, :not_found} = Operately.People.Person.get(ctx.limited, id: guest.id)

      assert {200, %{success: true}} =
               permission_request(ctx, [%{id: guest.id, access_level: Binding.comment_access()}])

      assert_member_access_level(ctx.space, guest, Binding.comment_access())
    end
  end

  describe "external credentials" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_api_token(:write_token, :creator, read_only: false)
      |> Factory.add_api_token(:read_token, :creator, read_only: true)
    end

    test "write token rejects a foreign person without changing state", ctx do
      foreign_id = invalid_person_id(ctx, :other_company)
      refute space_member?(ctx.space, foreign_id)

      assert_unchanged(fn ->
        assert {400, res} =
                 external_mutation(external_conn(), ctx.write_token, "spaces/update_members_permissions", %{
                   space_id: ctx.space.id,
                   members: [%{id: foreign_id, access_level: Binding.edit_access()}]
                 })

        assert res.message == "The request was malformed"
        refute response_identifies?(res, foreign_id)
      end)

      refute person_binding(ctx.space, foreign_id)
    end

    test "read-only token cannot update member permissions", ctx do
      assert_unchanged(fn ->
        assert {403, "Read-only API tokens cannot execute mutations"} =
                 external_mutation(external_conn(), ctx.read_token, "spaces/update_members_permissions", %{
                   space_id: ctx.space.id,
                   members: [%{id: ctx.creator.id, access_level: Binding.edit_access()}]
                 })
      end)
    end
  end

  #
  # Steps
  #

  defp request(conn, space, people) do
    mutation(conn, [:spaces, :update_members_permissions], %{
      space_id: Paths.space_id(space),
      members: Enum.map(people, fn {p, level} ->
        %{
          id: Paths.person_id(p),
          access_level: level,
        }
      end)
    })
  end

  defp assert_member_access_level(space, person, access_level) do
    context = Access.get_context!(group_id: space.id)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: access_level)
  end

  defp refute_member_access_level(space, person, access_level) do
    context = Access.get_context!(group_id: space.id)
    group = Access.get_group!(person_id: person.id)

    refute Access.get_binding(context_id: context.id, group_id: group.id, access_level: access_level)
  end

  #
  # Helpers
  #

  defp create_space_with_members(ctx, attrs \\ []) do
    space = group_fixture(ctx[:creator] || ctx.person, %{
      company_id: ctx.company.id,
      company_permissions: Keyword.get(attrs, :company_permissions, Binding.no_access()),
    })
    p1 = person_fixture(%{company_id: ctx.company.id})
    p2 = person_fixture(%{company_id: ctx.company.id})

    add_person_to_space(p1, space.id, Binding.view_access())
    add_person_to_space(p2, space.id, Binding.view_access())

    {space, p1, p2}
  end

  defp add_person_to_space(person, space_id, access_level) do
    Operately.Groups.add_members(person, space_id, [%{
      id: person.id,
      access_level: access_level,
    }])
  end

  defp permission_request(ctx, members, space \\ nil) do
    space = space || ctx.space

    mutation(ctx.conn, [:spaces, :update_members_permissions], %{
      space_id: space.id,
      members: members
    })
  end

  defp external_conn do
    Phoenix.ConnTest.build_conn()
    |> Plug.Conn.put_req_header("content-type", "application/json")
  end

  defp invalid_person_id(_ctx, :other_company), do: Factory.setup(%{}).creator.id
  defp invalid_person_id(_ctx, :missing), do: Ecto.UUID.generate()

  defp invalid_person_id(ctx, :same_account) do
    ctx = Factory.add_company(ctx, :other_company, ctx.account)

    Repo.get_by!(Operately.People.Person, company_id: ctx.other_company.id, account_id: ctx.account.id).id
  end

  defp invalid_person_id(ctx, suspension_field) do
    ctx = Factory.add_company_member(ctx, :invalid_person)
    value = if suspension_field == :suspended, do: true, else: DateTime.utc_now() |> DateTime.truncate(:second)
    ctx.invalid_person |> Ecto.Changeset.change(%{suspension_field => value}) |> Repo.update!()
    ctx.invalid_person.id
  end

  defp space_member?(space, person_id) do
    Repo.get_by(Operately.Groups.Member, group_id: space.id, person_id: person_id) != nil
  end

  defp person_binding(space, person_id) do
    context = Access.get_context!(group_id: space.id)

    case Access.get_group(person_id: person_id) do
      nil -> nil
      group -> Access.get_binding(context_id: context.id, group_id: group.id)
    end
  end

  defp remove_company_visibility(person) do
    context = Access.get_context!(company_id: person.company_id)
    group = Access.get_group!(person_id: person.id)

    case Access.get_binding(context_id: context.id, group_id: group.id) do
      nil -> :ok
      binding -> {:ok, _} = Access.update_binding(binding, %{access_level: Binding.no_access()})
    end

    company_group = Access.get_group!(company_id: person.company_id, tag: :standard)
    Access.remove_from_group(company_group, person_id: person.id)
  end

  defp response_identifies?(response, person_id) do
    response |> Jason.encode!() |> String.contains?(person_id)
  end

  defp assert_unchanged(fun) do
    before = state_snapshot()
    fun.()
    assert state_snapshot() == before
  end

  defp state_snapshot do
    [
      Operately.Projects.Project,
      Operately.Goals.Goal,
      Operately.ResourceHubs.ResourceHub,
      Operately.Projects.Contributor,
      Operately.Tasks.Assignee,
      Operately.ProjectTemplates.TaskAssignment,
      Operately.Access.Binding,
      Operately.Access.GroupMembership,
      Operately.Groups.Member,
      Operately.Notifications.Subscription,
      Operately.Notifications.SubscriptionList,
      Operately.Activities.Activity
    ]
    |> Map.new(fn schema -> {schema, Repo.all(schema) |> Enum.sort_by(& &1.id)} end)
  end
end
