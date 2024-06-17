defmodule Operately.CompaniesTest do
  use Operately.DataCase

  alias Operately.Companies

  describe "companies" do
    alias Operately.Companies.Company

    import Operately.CompaniesFixtures

    test "list_companies/0 returns all companies" do
      company = company_fixture()
      assert Companies.list_companies() == [company]
    end

    test "get_company!/1 returns the company with given id" do
      company = company_fixture()
      assert Companies.get_company!(company.id) == company
    end

    test "create_company/1 with valid data creates a company" do
      valid_attrs = %{mission: "some mission", company_name: "some name"}

      assert {:ok, %Company{} = company} = Companies.create_company(valid_attrs)
      assert company.name == "some name"
    end

    test "create_company/1 with invalid data returns error changeset" do
      invalid_attrs = %{mission: nil, company_name: nil}

      assert {:error, :company, _, _} = Companies.create_company(invalid_attrs)
    end

    test "update_company/2 with valid data updates the company" do
      company = company_fixture()
      update_attrs = %{mission: "some updated mission", name: "some updated name"}

      assert {:ok, %Company{} = company} = Companies.update_company(company, update_attrs)
      assert company.mission == "some updated mission"
      assert company.name == "some updated name"
    end

    test "update_company/2 with invalid data returns error changeset" do
      company = company_fixture()
      invalid_attrs = %{mission: nil, name: nil}

      assert {:error, %Ecto.Changeset{}} = Companies.update_company(company, invalid_attrs)
      assert company == Companies.get_company!(company.id)
    end

    test "change_company/1 returns a company changeset" do
      company = company_fixture()
      assert %Ecto.Changeset{} = Companies.change_company(company)
    end
  end
end
