defmodule Operately.Data.Change055RenameCompanySpaceToGeneralTest do
  use Operately.DataCase

  alias Operately.Groups

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures

  test "renames company space to General" do
    companies = create_companies()

    assert_space_names(companies, "Company")

    Operately.Data.Change055RenameCompanySpaceToGeneral.run()

    assert_space_names(companies, "General")
  end

  defp assert_space_names(companies, company_space_name) do
    Enum.each(companies, fn company ->
      spaces = Groups.list_groups_for_company(company.id)

      assert length(spaces) == 4

      company_spaces = Enum.filter(spaces, fn space -> space.name == company_space_name end)
      custom_spaces = Enum.filter(spaces, fn space -> space.name == "Custom Name" end)

      assert length(company_spaces) == 1
      assert length(custom_spaces) == 3

      assert company.company_space_id == hd(company_spaces).id
    end)
  end

  defp create_companies do
    Enum.map(1..3, fn _ ->
      company = company_fixture()

      create_spaces(company)
      set_company_space_name(company)

      company
    end)
  end

  defp create_spaces(company) do
    creator = Operately.People.list_people(company.id) |> hd()

    Enum.map(1..3, fn _ ->
      group_fixture(creator, %{name: "Custom Name"})
    end)
  end

  defp set_company_space_name(company) do
    {:ok, _} =
      company.company_space_id
      |> Groups.get_group!()
      |> Groups.update_group(%{name: "Company"})
  end
end
