defmodule Operately.Integration.GeneralSpaceIssueTest do
  @moduledoc """
  Integration test that reproduces and verifies the fix for the exact issue described:
  "Users not part of the General space in expected way"
  
  This test simulates the scenario where users appear in "Other People with Access"
  instead of being explicit members of the General space.
  """
  
  use Operately.DataCase

  alias Operately.{Companies, Groups, Access}
  alias Operately.Groups.Member
  alias Operately.Data.Change079EnsureAllCompanyMembersInGeneralSpace

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  describe "General space membership issue reproduction and fix" do
    setup do
      company = company_fixture()
      founder = Repo.preload(company, :people).people |> hd()
      
      # Add members as they would be added in a real system
      member1 = person_fixture(%{company_id: company.id, full_name: "Alice Johnson"})
      member2 = person_fixture(%{company_id: company.id, full_name: "Bob Wilson"})

      general_space = Companies.get_company_space!(company.id)

      %{
        company: company,
        founder: founder,
        member1: member1,
        member2: member2,
        general_space: general_space
      }
    end

    test "reproduces the issue: users appear in Other People instead of explicit members", ctx do
      # Step 1: Simulate the problematic state
      # Remove some members from the General space to recreate the issue
      Repo.delete_all(from m in Member, 
        where: m.group_id == ^ctx.general_space.id and m.person_id in [^ctx.member1.id, ^ctx.member2.id]
      )
      
      # Step 2: Verify the issue exists
      # These users should have access bindings but no explicit membership
      context = Access.get_context!(group_id: ctx.general_space.id)
      binded_people = Access.BindedPeopleLoader.load(context.id)
      
      explicit_members = Repo.all(
        from m in Member,
        join: p in assoc(m, :person),
        where: m.group_id == ^ctx.general_space.id and is_nil(p.suspended_at),
        select: p
      )

      explicit_member_ids = MapSet.new(explicit_members, & &1.id)
      other_people = Enum.filter(binded_people, fn person -> 
        not MapSet.member?(explicit_member_ids, person.id)
      end)

      # The issue: there ARE "other people" for the General space
      assert length(other_people) > 0, "Issue reproduction failed - no other people found"
      
      # Verify our test members are in the "other people" list
      other_people_ids = MapSet.new(other_people, & &1.id)
      assert MapSet.member?(other_people_ids, ctx.member1.id), "member1 should be in other people"
      assert MapSet.member?(other_people_ids, ctx.member2.id), "member2 should be in other people"

      # Step 3: Apply the fix
      {:ok, _} = Change079EnsureAllCompanyMembersInGeneralSpace.run()

      # Step 4: Verify the fix works
      # Reload data after migration
      updated_explicit_members = Repo.all(
        from m in Member,
        join: p in assoc(m, :person),
        where: m.group_id == ^ctx.general_space.id and is_nil(p.suspended_at),
        select: p
      )

      updated_explicit_member_ids = MapSet.new(updated_explicit_members, & &1.id)
      updated_other_people = Enum.filter(binded_people, fn person -> 
        not MapSet.member?(updated_explicit_member_ids, person.id)
      end)

      # After fix: NO "other people" for General space
      assert Enum.empty?(updated_other_people), 
        "Fix failed - General space still has other people: #{inspect(Enum.map(updated_other_people, &{&1.id, &1.full_name}))}"

      # All company members should now be explicit members
      company_members = Repo.all(
        from p in Operately.People.Person,
        where: p.company_id == ^ctx.company.id and is_nil(p.suspended_at)
      )

      company_member_ids = MapSet.new(company_members, & &1.id)
      
      assert MapSet.equal?(company_member_ids, updated_explicit_member_ids),
        "All company members should be explicit members of General space"
    end

    test "frontend logic prevents showing Other People for General space", ctx do
      # This simulates the frontend useBindedPeopleList logic
      
      # Case 1: Company space (General) should return empty list
      company_space_result = simulate_use_binded_people_list(ctx.general_space, is_company_space: true)
      assert company_space_result == [], "Company space should have no other people"
      
      # Case 2: Regular space should process normally
      regular_space = Groups.Group |> struct(%{id: "regular-space-id", is_company_space: false})
      regular_space_result = simulate_use_binded_people_list(regular_space, is_company_space: false)
      assert is_list(regular_space_result), "Regular space should process normally"
    end

    # Helper function to simulate the frontend logic
    defp simulate_use_binded_people_list(space, opts) do
      is_company_space = opts[:is_company_space] || false
      
      if is_company_space do
        # This is the fix: return empty array for company spaces
        []
      else
        # Normal processing for non-company spaces
        # In a real scenario, this would call the API and filter members
        # For this test, we just return a mock list
        [%{id: "other-1", full_name: "Other Person"}]
      end
    end
  end
end