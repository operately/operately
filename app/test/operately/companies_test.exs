defmodule Operately.CompaniesTest do
  use Operately.DataCase

  alias Operately.Companies
  alias Operately.Companies.Company

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup do 
    account = account_fixture()

    {:ok, %{account: account}}
  end

  describe "companies" do
    test "list_companies/0 returns all companies", ctx do
      company = company_fixture(%{}, ctx.account)
      assert Companies.list_companies() == [company]
    end

    test "get_company!/1 returns the company with given id", ctx do
      company = company_fixture(%{}, ctx.account)
      assert Companies.get_company!(company.id) == company
    end

    test "create_company/1 with valid data creates a company", ctx do
      valid_attrs = %{mission: "some mission", company_name: "some name", title: "Founder"}

      assert {:ok, %Company{} = company} = Companies.create_company(valid_attrs, ctx.account)
      assert company.name == "some name"
    end

    test "create_company/1 with invalid data returns error changeset", ctx do
      invalid_attrs = %{mission: nil, company_name: nil}

      assert {:error, :company, _, _} = Companies.create_company(invalid_attrs, ctx.account)
    end

    test "update_company/2 with valid data updates the company", ctx do
      company = company_fixture(%{}, ctx.account)
      update_attrs = %{mission: "some updated mission", name: "some updated name"}

      assert {:ok, %Company{} = company} = Companies.update_company(company, update_attrs)
      assert company.mission == "some updated mission"
      assert company.name == "some updated name"
    end

    test "update_company/2 with invalid data returns error changeset", ctx do
      company = company_fixture(%{}, ctx.account)
      invalid_attrs = %{mission: nil, name: nil}

      assert {:error, %Ecto.Changeset{}} = Companies.update_company(company, invalid_attrs)
      assert company == Companies.get_company!(company.id)
    end

    test "change_company/1 returns a company changeset", ctx do
      company = company_fixture(%{}, ctx.account)
      assert %Ecto.Changeset{} = Companies.change_company(company)
    end
  end
end
