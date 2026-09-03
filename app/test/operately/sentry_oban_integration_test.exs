defmodule Operately.SentryObanIntegrationTest do
  use Operately.DataCase

  import Mock

  describe "Sentry Oban Integration" do
    test "telemetry handler reports Oban exceptions to Sentry" do
      with_mock Sentry, capture_exception: fn _error, _opts -> {:ok, "fake-event-id"} end do
        events = [[:oban, :job, :exception]]

        :telemetry.attach_many(
          "test-sentry-oban-errors",
          events,
          &Operately.Application.handle_oban_exception/4,
          %{}
        )

        job = %Oban.Job{
          id: 123,
          queue: "default",
          worker: "TestWorker",
          args: %{"test" => "data"},
          attempt: 1,
          max_attempts: 3
        }

        measurements = %{duration: 1000, queue_time: 500}

        metadata = %{
          job: job,
          error: %RuntimeError{message: "Test error"},
          stacktrace: [{TestWorker, :perform, 1, [file: "test.ex", line: 10]}]
        }

        :telemetry.execute([:oban, :job, :exception], measurements, metadata)

        :timer.sleep(10)

        assert_called Sentry.capture_exception(:_, :_)

        :telemetry.detach("test-sentry-oban-errors")
      end
    end

    test "creates proper context for Sentry error reporting" do
      job = %Oban.Job{
        id: 456,
        queue: "mailer",
        worker: "Operately.Notifications.EmailWorker",
        args: %{"notification_id" => "abc123"},
        attempt: 2,
        max_attempts: 5
      }

      measurements = %{duration: 2500, queue_time: 100}
      error = %ArgumentError{message: "Invalid email address"}
      stacktrace = [{EmailWorker, :perform, 1, [file: "email_worker.ex", line: 15]}]

      metadata = %{
        job: job,
        error: error,
        stacktrace: stacktrace
      }

      with_mock Sentry,
                capture_exception: fn exc, opts ->
                  assert exc == error

                  contexts = Keyword.get(opts, :contexts, %{})
                  assert contexts[:tags][:worker] == "Operately.Notifications.EmailWorker"
                  assert contexts[:tags][:queue] == "mailer"
                  assert contexts[:tags][:oban_job] == true

                  extra = contexts[:extra]
                  assert extra[:job_id] == 456
                  assert extra[:attempt] == 2
                  assert extra[:max_attempts] == 5
                  assert extra[:duration] == 2500
                  assert extra[:queue_time] == 100

                  {:ok, "fake-event-id"}
                end do
        events = [[:oban, :job, :exception]]

        :telemetry.attach_many(
          "test-sentry-oban-errors-context",
          events,
          &Operately.Application.handle_oban_exception/4,
          %{}
        )

        :telemetry.execute([:oban, :job, :exception], measurements, metadata)

        :timer.sleep(10)

        assert_called Sentry.capture_exception(error, :_)

        :telemetry.detach("test-sentry-oban-errors-context")
      end
    end
  end
end
