defmodule Operately.Demo.Company do
  @moduledoc """
  Create a company for the demo.
  """

  import Ecto.Query

  def create_company(context) do
    cleanup_acme_companies()

    {:ok, company} = Operately.Operations.CompanyAdding.run(%{
      company_name: context.company_name,
      title: context.title,
    }, context.account)

    owner = Operately.People.get_person!(context.account, company)

    context
    |> Map.put(:company, company)
    |> Map.put(:owner, owner)
  end

  @doc """
  As we don't have a way to delete companies (yet), we are cleaning up
  the database by renaming companies that contain 'Acme Inc.' in their 
  name.

  We are doing this only in the development environment, to not risk
  renaming companies in production by mistake.
  """
  def cleanup_acme_companies do
    if Application.get_env(:operately, :app_env) == :dev do
      companies = Operately.Repo.all(from c in Operately.Companies.Company)

      companies |> Enum.each(fn c ->
        if String.contains?(c.name, "Acme Inc.") do
          Operately.Companies.update_company(c, %{name: "#{c.short_id}"})
        end
      end)
    end
  end
end
