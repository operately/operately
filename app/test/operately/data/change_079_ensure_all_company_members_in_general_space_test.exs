defmodule Operately.Data.Change079EnsureAllCompanyMembersInGeneralSpaceTest do
  use Operately.DataCase

  alias Operately.{Companies, Groups}
  alias Operately.Groups.Member
  alias Operately.Data.Change079EnsureAllCompanyMembersInGeneralSpace

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:alice)
    |> Factory.add_company_member(:bob)
    |> Factory.add_company_member(:charlie)
  end

  test "adds missing company members to General space", ctx do
    general_space = Companies.get_company_space!(ctx.company.id)
    
    # Initially, let's simulate a scenario where some members are missing
    # Remove alice and bob from the General space to simulate the issue
    Repo.delete_all(from m in Member, 
      where: m.group_id == ^general_space.id and m.person_id in [^ctx.alice.id, ^ctx.bob.id]
    )
    
    # Verify they are not in the space initially
    initial_members = get_space_member_ids(general_space.id)
    refute ctx.alice.id in initial_members
    refute ctx.bob.id in initial_members
    # Charlie and the creator should still be there
    assert ctx.charlie.id in initial_members
    assert ctx.creator.id in initial_members
    
    # Run the migration
    Change079EnsureAllCompanyMembersInGeneralSpace.run()
    
    # Verify all company members are now in the General space
    final_members = get_space_member_ids(general_space.id)
    company_member_ids = get_company_member_ids(ctx.company.id)
    
    assert Enum.sort(final_members) == Enum.sort(company_member_ids),
      "All company members should be in the General space after migration"
  end

  test "does not create duplicate memberships", ctx do
    general_space = Companies.get_company_space!(ctx.company.id)
    
    # Get initial count
    initial_count = Repo.aggregate(
      from(m in Member, where: m.group_id == ^general_space.id), 
      :count
    )
    
    # Run migration twice
    Change079EnsureAllCompanyMembersInGeneralSpace.run()
    Change079EnsureAllCompanyMembersInGeneralSpace.run()
    
    # Count should not change on second run
    final_count = Repo.aggregate(
      from(m in Member, where: m.group_id == ^general_space.id), 
      :count
    )
    
    assert final_count == initial_count, 
      "Migration should be idempotent and not create duplicates"
  end

  test "handles companies without general space gracefully", ctx do
    # This test ensures the migration doesn't crash if a company somehow lacks a general space
    # (though this shouldn't happen in normal operation)
    
    # Create a company without setting company_space_id
    invalid_company = %Operately.Companies.Company{
      id: Ecto.UUID.generate(),
      name: "Test Company",
      company_space_id: nil
    } |> Repo.insert!()
    
    # Migration should not crash
    assert {:ok, _} = Change079EnsureAllCompanyMembersInGeneralSpace.run()
  end

  # Helper functions
  defp get_space_member_ids(space_id) do
    from(m in Member, where: m.group_id == ^space_id, select: m.person_id)
    |> Repo.all()
  end

  defp get_company_member_ids(company_id) do
    from(p in Operately.People.Person, 
      where: p.company_id == ^company_id and is_nil(p.suspended_at), 
      select: p.id
    )
    |> Repo.all()
  end
end