defmodule Operately.CompaniesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Companies` context.
  """

  @doc """
  Generate a company.
  """
  def company_fixture(attrs \\ %{}) do
    {:ok, company} =
      attrs
      |> Enum.into(%{
        mission: "some mission",
        name: "some name"
      })
      |> Operately.Companies.create_company()

    company
  end
end
