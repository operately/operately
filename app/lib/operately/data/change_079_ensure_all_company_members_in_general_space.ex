defmodule Operately.Data.Change079EnsureAllCompanyMembersInGeneralSpace do
  @moduledoc """
  Ensures all company members are explicit members of the General space.
  
  This migration addresses cases where some company members have access bindings
  to the General space but are not explicit members, causing them to appear in
  "Other People with Access" instead of the main member list.
  
  For the General space specifically, ALL company members should be explicit members.
  """
  
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Companies, Groups}
  alias Operately.Companies.Company
  alias Operately.Groups.Member
  alias Operately.People.Person

  def run do
    Repo.transaction(fn ->
      companies = list_companies()
      
      Enum.each(companies, &ensure_all_members_in_general_space/1)
    end)
  end

  defp list_companies do
    from(c in Company, where: not is_nil(c.company_space_id))
    |> Repo.all()
  end

  defp ensure_all_members_in_general_space(company) do
    general_space = Companies.get_company_space!(company.id)
    
    # Get all company members
    company_members = from(p in Person, 
      where: p.company_id == ^company.id and is_nil(p.suspended_at)
    ) |> Repo.all()
    
    # Get existing space members
    existing_member_ids = from(m in Member,
      where: m.group_id == ^general_space.id,
      select: m.person_id
    ) |> Repo.all() |> MapSet.new()
    
    # Find company members who are not explicit space members
    missing_members = Enum.filter(company_members, fn person ->
      not MapSet.member?(existing_member_ids, person.id)
    end)
    
    # Add missing members to the General space
    Enum.each(missing_members, fn person ->
      create_space_membership(person.id, general_space.id)
    end)
    
    if length(missing_members) > 0 do
      IO.puts("Added #{length(missing_members)} missing members to General space for company #{company.id}")
    end
  end

  defp create_space_membership(person_id, group_id) do
    case Repo.get_by(Member, person_id: person_id, group_id: group_id) do
      nil ->
        %Member{}
        |> Member.changeset(%{person_id: person_id, group_id: group_id})
        |> Repo.insert!()
        
      _existing -> 
        :already_exists
    end
  end
end