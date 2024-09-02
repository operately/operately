defmodule Operately.Demo.Cleanup do
  @moduledoc """
  As we don't have a way to delete companies (yet), we are cleaning up
  the database by renaming companies that contain 'Acme Inc.' in their 
  name.

  We are doing this only in the development environment, to not risk
  renaming companies in production by mistake.
  """

  import Ecto.Query

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
