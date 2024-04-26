defmodule Mix.Tasks.Operately.Create.Company do
  def run([name]) do
    Mix.Task.run("app.start")
    Application.ensure_started(Operately.Repo, [])

    validate_name(name)
    {:ok, _} = Operately.Companies.create_company(%{name: name})

    IO.puts("Company created successfully")
  end

  def validate_name(name) do
    unless String.length(name) >= 3 do
      IO.puts("Company name must be at least 3 characters long. Current length: #{String.length(name)}")
      System.halt(1)
    end
  end
end
