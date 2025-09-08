defmodule OperatelyEE.AdminApi.Queries.GetActiveCompaniesTest do
  use Operately.DataCase

  alias OperatelyEE.AdminApi.Queries.GetActiveCompanies
  alias Operately.Support.Factory

  setup ctx do
    ctx
  end


  describe "GetActiveCompanies.call/2" do
    test "returns empty list when no companies exist" do
      assert {:ok, %{companies: []}} = GetActiveCompanies.call(nil, %{})
    end

    test "returns empty list when no companies meet activity criteria", ctx do
      Factory.setup(ctx)

      # Only has 1 member (the creator), no goals, no projects, no recent activity
      assert {:ok, %{companies: []}} = GetActiveCompanies.call(nil, %{})
    end

    test "returns companies that meet all activity criteria", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      # Add recent activity (within 14 days)
      create_recent_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})

      assert length(result.companies) == 1
      assert Enum.any?(result.companies, &(&1.name == ctx.company.name))

      active_company = Enum.find(result.companies, &(&1.name == ctx.company.name))
      assert active_company.people_count >= 2
      assert active_company.goals_count >= 2
      assert active_company.projects_count >= 2
      assert active_company.last_activity_at != nil
    end

    test "excludes companies with insufficient members", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal1, :space)
        |> Factory.add_goal(:goal2, :space)
        |> Factory.add_project(:project1, :space)
        |> Factory.add_project(:project2, :space)

      # Only has 1 member (the creator)
      # Add recent activity
      create_recent_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with insufficient goals", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)  # Only 1 goal
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      # Add recent activity
      create_recent_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with insufficient projects", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)  # Only 1 project

      # Add recent activity
      create_recent_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies without recent activity", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      # No recent activity
      delete_all_activities(ctx.company)
      create_old_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with activity exactly 15 days old", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      delete_all_activities(ctx.company)

      # Add activity exactly 15 days old (should be excluded)
      activity_date = DateTime.add(DateTime.utc_now(), -15, :day)
      create_activity_at_date(ctx.company, activity_date)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "includes companies with activity exactly 14 days old", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      # Add activity exactly 14 days old (should be included)
      activity_date = DateTime.add(DateTime.utc_now(), -14, :day)
      create_activity_at_date(ctx.company, activity_date)

      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert length(result.companies) == 1
    end

    test "serializes company data correctly", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_goal(:goal1, :space, creator: :member1)
        |> Factory.add_goal(:goal2, :space, creator: :member2)
        |> Factory.add_project(:project1, :space, creator: :member1)
        |> Factory.add_project(:project2, :space, creator: :member2)

      # Add recent activity
      create_recent_activity(ctx.company)

      {:ok, result} = GetActiveCompanies.call(nil, %{})

      assert length(result.companies) == 1
      company_data = hd(result.companies)

      # Verify required fields are present
      assert Map.has_key?(company_data, :id)
      assert Map.has_key?(company_data, :name)
      assert Map.has_key?(company_data, :people_count)
      assert Map.has_key?(company_data, :goals_count)
      assert Map.has_key?(company_data, :spaces_count)
      assert Map.has_key?(company_data, :projects_count)
      assert Map.has_key?(company_data, :owners)
      assert Map.has_key?(company_data, :last_activity_at)
      assert Map.has_key?(company_data, :inserted_at)

      # Verify data types and values
      assert is_binary(company_data.id)
      assert is_binary(company_data.name)
      assert is_integer(company_data.people_count)
      assert is_integer(company_data.goals_count)
      assert is_integer(company_data.spaces_count)
      assert is_integer(company_data.projects_count)
      assert is_list(company_data.owners)
    end
  end

  # Helper functions to create test data

  defp create_recent_activity(company) do
    # Create activity within the last 14 days
    activity_date = DateTime.add(DateTime.utc_now(), -7, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_old_activity(company) do
    # Create activity older than 14 days
    activity_date = DateTime.add(DateTime.utc_now(), -20, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_activity_at_date(company, date) do
    # Create an activity with specific date and company_id in content
    # Use Ecto.Repo.insert! to create the activity directly in the database
    Operately.Repo.insert!(%Operately.Activities.Activity{
      action: "goal_created",
      content: %{
        "company_id" => to_string(company.id),
        "goal_id" => Ecto.UUID.generate()
      },
      inserted_at: date |> DateTime.to_naive() |> NaiveDateTime.truncate(:second),
      updated_at: date |> DateTime.to_naive() |> NaiveDateTime.truncate(:second)
    })
  end

  defp delete_all_activities(company) do
    Operately.Repo.delete_all(Operately.Activities.Activity, where: [company_id: company.id])
  end
end
