defmodule OperatelyEmail.Cron.AssignmentsTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias OperatelyEmail.Cron.Assignments

  describe "send_mode/1" do
    test "uses baseline assignment digests on workdays" do
      assert Assignments.send_mode(~D[2026-06-01]) == :baseline_and_reminders
    end

    test "uses explicit reminders only on weekends" do
      assert Assignments.send_mode(~D[2026-06-06]) == :explicit_reminders_only
    end
  end

  describe "people_who_want_assignment_emails/0" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:enabled_member)
        |> Factory.add_company_member(:disabled_member, preferences: %{notifications: %{notify_about_assignments: false}})

      {:ok, no_account_member} =
        Operately.People.create_person(%{
          company_id: ctx.company.id,
          full_name: "No Account Member",
          preferences: %{notifications: %{notify_about_assignments: true}}
        })

      {:ok, Map.put(ctx, :no_account_member, no_account_member)}
    end

    test "returns only people with account emails and assignment emails enabled", ctx do
      people = Assignments.people_who_want_assignment_emails()

      assert MapSet.new(Enum.map(people, & &1.id)) == MapSet.new([ctx.creator.id, ctx.enabled_member.id])
      refute Enum.any?(people, &(&1.id == ctx.disabled_member.id))
      refute Enum.any?(people, &(&1.id == ctx.no_account_member.id))
      assert Enum.all?(people, &Ecto.assoc_loaded?(&1.account))
      assert Enum.all?(people, &Ecto.assoc_loaded?(&1.company))
    end

    test "treats missing notifications preferences as enabled", ctx do
      ctx.enabled_member
      |> Ecto.Changeset.change(%{preferences: nil})
      |> Repo.update!()

      people = Assignments.people_who_want_assignment_emails()

      assert MapSet.new(Enum.map(people, & &1.id)) == MapSet.new([ctx.creator.id, ctx.enabled_member.id])
    end
  end
end
