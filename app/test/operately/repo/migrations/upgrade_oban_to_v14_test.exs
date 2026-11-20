defmodule Operately.Repo.Migrations.UpgradeObanToV14Test do
  use Operately.DataCase

  alias Operately.Repo.Migrations.UpgradeObanToV14

  @version 20_261_120_110_342

  setup do
    Code.require_file("priv/repo/migrations/20261120110342_upgrade_oban_to_v14.exs")
    :ok
  end

  test "upgrades populated version 11 storage and rolls back without losing jobs" do
    migrate(:down)
    assert Oban.Migration.migrated_version(repo: Repo) == 11

    jobs =
      for state <- ["available", "scheduled", "retryable", "executing", "completed", "cancelled", "discarded"] do
        %{"notification_id" => Ecto.UUID.generate()}
        |> Oban.Job.new(worker: Operately.Notifications.EmailWorker, queue: :mailer)
        |> Ecto.Changeset.change(state: state, attempt: 1, scheduled_at: ~U[2030-01-01 12:00:00.000000Z])
        |> Repo.insert!()
        |> Repo.reload!()
      end

    migrate(:up)
    assert Oban.Migration.migrated_version(repo: Repo) == 14
    assert_jobs_unchanged(jobs)

    migrate(:down)
    assert Oban.Migration.migrated_version(repo: Repo) == 11
    assert_jobs_unchanged(jobs)
    assert %{rows: [[true]]} = Repo.query!("SELECT to_regclass('public.oban_peers') IS NOT NULL")
  end

  defp migrate(direction) do
    # Schema changes are rolled back with the sandbox transaction.
    Ecto.Migration.Runner.run(Repo, Repo.config(), @version, UpgradeObanToV14, :forward, direction, direction, log: false)
  end

  defp assert_jobs_unchanged(jobs) do
    for job <- jobs do
      assert Repo.get!(Oban.Job, job.id) == job
    end
  end
end
