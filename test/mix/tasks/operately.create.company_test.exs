defmodule Operately.Mix.Tasks.Create.CompanyTest do
  use Operately.DataCase

  test "run/1 creates a company" do
    assert Operately.Companies.Company |> Operately.Repo.all() |> length() == 0

    Mix.Tasks.Operately.Create.Company.run(["Acme Inc."])

    assert company = Operately.Companies.get_company_by_name("Acme Inc.")
    assert company.name == "Acme Inc."
  end
end
