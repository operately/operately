defmodule Mix.Tasks.Operately.Create.Account do
  def run([name, email, password]) do
    Mix.Task.run("app.start")
    Application.ensure_started(Operately.Repo, [])

    validate_name(name)
    validate_email(email)
    validate_password(password)

    {:ok, _} = 
      Operately.People.Account.registration_changeset(%{
        full_name: String.trim(name),
        email: email, 
        password: password
      })
      |> Operately.Repo.insert()

    IO.puts("Account created successfully, for: #{email}")
  end

  def validate_name(name) do
    trimmed = String.trim(name)

    if trimmed == "" do
      IO.puts("Name cannot be empty")
      System.halt(1)
    end

    if String.split(trimmed, " ") |> Enum.count() < 2 do
      IO.puts("Please provide your full name, ex. John Doe")
      System.halt(1)
    end
  end

  def validate_email(email) do
    unless String.contains?(email, "@") do
      IO.puts("Email must contain an @ symbol, ex. john@localhost.dev")
      System.halt(1)
    end
  end

  def validate_password(password) do
    unless String.length(password) >= 12 do
      IO.puts("Password must be at least 12 characters long. Current length: #{String.length(password)}")
      System.halt(1)
    end
  end
end
