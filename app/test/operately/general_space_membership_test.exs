defmodule Operately.GeneralSpaceMembershipTest do
  use Operately.DataCase

  alias Operately.{Companies, Groups, Access}
  alias Operately.Groups.Member

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  describe "General space membership consistency" do
    setup do
      company = company_fixture()
      founder = Repo.preload(company, :people).people |> hd()
      
      # Add some additional members to test with
      member1 = person_fixture(%{company_id: company.id, full_name: "Member One"})
      member2 = person_fixture(%{company_id: company.id, full_name: "Member Two"})

      general_space = Companies.get_company_space!(company.id)

      %{
        company: company, 
        founder: founder,
        member1: member1,
        member2: member2,
        general_space: general_space
      }
    end

    test "all company members should be explicit members of General space", ctx do
      # Get all company members
      company_members = Repo.all(
        from p in Operately.People.Person,
        where: p.company_id == ^ctx.company.id and is_nil(p.suspended_at)
      )

      # Get all explicit members of the General space
      space_members = Repo.all(
        from m in Member,
        join: p in assoc(m, :person),
        where: m.group_id == ^ctx.general_space.id and is_nil(p.suspended_at),
        select: p
      )

      company_member_ids = Enum.map(company_members, & &1.id) |> Enum.sort()
      space_member_ids = Enum.map(space_members, & &1.id) |> Enum.sort()

      # All company members should be explicit members of General space
      assert company_member_ids == space_member_ids, 
        "Company members #{inspect(company_member_ids)} should match General space members #{inspect(space_member_ids)}"
    end

    test "no company members should appear as 'Other People' for General space", ctx do
      # Get the access context for the General space
      context = Access.get_context!(group_id: ctx.general_space.id)
      
      # Get all people with access bindings to the General space
      binded_people = Access.BindedPeopleLoader.load(context.id)
      
      # Get explicit members of the General space
      explicit_members = Repo.all(
        from m in Member,
        join: p in assoc(m, :person),
        where: m.group_id == ^ctx.general_space.id and is_nil(p.suspended_at),
        select: p
      )

      # Filter binded people to get "other people" (those not in explicit members)
      explicit_member_ids = MapSet.new(explicit_members, & &1.id)
      other_people = Enum.filter(binded_people, fn person -> 
        not MapSet.member?(explicit_member_ids, person.id)
      end)

      # For General space, there should be NO "other people"
      assert Enum.empty?(other_people), 
        "General space should have no 'Other People', but found: #{inspect(Enum.map(other_people, &{&1.id, &1.full_name}))}"
    end

    test "General space is correctly identified as company space", ctx do
      space = Repo.preload(ctx.general_space, :company)
      assert space.company.company_space_id == space.id, "General space should be the company space"
    end
  end
end