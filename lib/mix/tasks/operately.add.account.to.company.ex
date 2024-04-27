defmodule Mix.Tasks.Operately.Add.Account.To.Company do
  def run([account_email, company_name, full_name, role]) do
    Mix.Task.run("app.start")
    Application.ensure_started(Operately.Repo, [])

    company = find_company(company_name)
    account = find_account(account_email)
    
    validate_name(full_name)
    validate_role(role)

    {:ok, _} = 
      Operately.People.Person.changeset(%{
        company_id: company.id,
        account_id: account.id,
        full_name: full_name,
        email: account.email,
        avatar_url: "",
        title: role
      })
      |> Operately.Repo.insert()
  end

  def find_company(company_name) do
    company = Operately.Companies.get_company_by_name(company_name)

    unless company do
      IO.puts("Company not found: #{company_name}")
      System.halt(1)
    end

    company
  end

  def find_account(account_email) do
    account = Operately.People.get_account_by_email(account_email)

    unless account do
      IO.puts("Account not found: #{account_email}")
      System.halt(1)
    end

    account
  end

  def validate_name(full_name) do
    unless String.length(full_name) >= 3 do
      IO.puts("The profile name in the company must be at least 3 characters long. Current length: #{String.length(full_name)}")
      System.halt(1)
    end

    unless String.contains?(full_name, " ") do
      IO.puts("The profile name in the company must contain a space, ex. John Doe")
      System.halt(1)
    end
  end

  def validate_role(role) do
    unless String.length(role) >= 3 do
      IO.puts("The role in the company must be at least 3 characters long. Current length: #{String.length(role)}")
      System.halt(1)
    end
  end

end
