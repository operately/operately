defmodule Operately.Demo do
  def run(company_name, owner_email) do
    account = find_account!(owner_email)

    context = %{
      company_name: company_name,
      onwer_email: owner_email,
      account: account
    }

    Operately.Repo.transaction(fn ->
      Operately.Demo.Cleanup.cleanup_acme_companies()

      context
      |> create_company()
      |> set_owner_avatar()
      |> add_employees()
      |> create_spaces()
      |> create_goals_and_projects()

      # check_in_to_every_goal(me, company)
    end)
  end

  def find_account!(email) do
    case Operately.People.get_account_by_email(email) do
      nil -> raise "Account not found"
      account -> account
    end
  end

  def create_company(context) do
    {:ok, company} = Operately.Operations.CompanyAdding.run(%{
      company_name: context.company_name,
      title: "Founder"
    }, context.account)

    owner = Operately.People.get_person!(context.account, context.company)

    context
    |> Map.put(:company, company)
    |> Map.put(:owner, owner)
  end

  def create_spaces(context) do
    Operately.Demo.Spaces.create_spaces(context)
  end

  def add_employees(context) do
    Operately.Demo.Employees.create_employees(context)
  end

  def set_owner_avatar(context) do
    Operately.Demo.Employees.set_owner_avatar(context)
  end

  def create_goals_and_projects(context) do
    Operately.Demo.Goals.create_goals_and_projects(context)
  end

  def check_in_to_every_goal(_me, company) do
    import Ecto.Query

    Operately.Repo.all(from g in Operately.Goals.Goal, where: g.company_id == ^company.id, preload: [:targets, :champion])
    |> Enum.each(fn g ->
      n = Enum.map(g.targets, fn t ->
        %{
          "id" => t.id,
          "value" => trunc(t.to/2) + :rand.uniform(trunc(t.to/2))
        }
      end)

      Operately.Operations.GoalCheckIn.run(g.champion, g, Operately.Support.RichText.rich_text("Everything is going as planned! Last week we had a new batch of beta testers and they loved the product! We are now fully focusing on eliminating the leftover bugs"), n)
    end)
  end
end

defmodule Operately.Support.RichText do
  def rich_text(text) do
    %{
      type: :doc,
      content: [
        %{
          type: :paragraph,
          content: [
            %{
              type: :text,
              text: text
            }
          ]
        }
      ]
    }
    |> Jason.encode!() 
    |> Jason.decode!()
  end

  def rich_text(text, :as_string) do
    rich_text(text) |> Jason.encode!()
  end
end

