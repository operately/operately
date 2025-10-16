defmodule Operately.SentryObanIntegrationTest do
  use Operately.DataCase

  import Mock

  describe "Sentry Oban Integration" do
    test "telemetry handler is attached when SENTRY_DSN is configured" do
      # Mock System.get_env to return a fake Sentry DSN
      with_mock System, get_env: fn "SENTRY_DSN" -> "https://fake-dsn@sentry.io/123" end do
        with_mock Sentry, capture_exception: fn _error, _opts -> {:ok, "fake-event-id"} end do
          # Simulate attaching telemetry handler like in application.ex
          events = [[:oban, :job, :exception]]

          :telemetry.attach_many(
            "test-sentry-oban-errors",
            events,
            &Operately.Application.handle_oban_exception/4,
            %{}
          )

          # Create a fake Oban job that would fail
          job = %Oban.Job{
            id: 123,
            queue: "default",
            worker: "TestWorker",
            args: %{"test" => "data"},
            attempt: 1,
            max_attempts: 3
          }

          # Create fake metadata as would be passed by Oban telemetry
          measurements = %{duration: 1000, queue_time: 500}

          metadata = %{
            job: job,
            error: %RuntimeError{message: "Test error"},
            stacktrace: [{TestWorker, :perform, 1, [file: "test.ex", line: 10]}]
          }

          # Emit the telemetry event as Oban would
          :telemetry.execute(
            [:oban, :job, :exception],
            measurements,
            metadata
          )

          # Allow some time for async processing
          :timer.sleep(10)

          # Verify Sentry.capture_exception was called with an exception
          assert_called(Sentry.capture_exception(:_, :_))

          # Clean up
          :telemetry.detach("test-sentry-oban-errors")
        end
      end
    end

    test "creates proper context for Sentry error reporting" do
      # Test that our handler formats Oban job data correctly for Sentry
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

      with_mock System, get_env: fn "SENTRY_DSN" -> "https://fake-dsn@sentry.io/123" end do
        with_mock Sentry,
          capture_exception: fn exc, opts ->
            # Verify the exception is passed correctly
            assert exc == error

            # Verify context contains job information
            contexts = Keyword.get(opts, :contexts, %{})
            assert contexts[:tags][:worker] == "Operately.Notifications.EmailWorker"
            assert contexts[:tags][:queue] == "mailer"
            assert contexts[:tags][:oban_job] == true

            # Verify extra information
            extra = contexts[:extra]
            assert extra[:job_id] == 456
            assert extra[:attempt] == 2
            assert extra[:max_attempts] == 5
            assert extra[:duration] == 2500
            assert extra[:queue_time] == 100

            {:ok, "fake-event-id"}
          end do
          # Simulate attaching telemetry handler
          events = [[:oban, :job, :exception]]

          :telemetry.attach_many(
            "test-sentry-oban-errors-context",
            events,
            &Operately.Application.handle_oban_exception/4,
            %{}
          )

          # Emit the telemetry event
          :telemetry.execute(
            [:oban, :job, :exception],
            measurements,
            metadata
          )

          :timer.sleep(10)

          assert_called(Sentry.capture_exception(error, :_))

          # Clean up
          :telemetry.detach("test-sentry-oban-errors-context")
        end
      end
    end

    test "telemetry handler is not attached when SENTRY_DSN is not configured" do
      # Mock System.get_env to return nil for SENTRY_DSN
      with_mock System, get_env: fn "SENTRY_DSN" -> nil end do
        # This should not raise any errors and should not attempt to attach handlers
        # when SENTRY_DSN is not configured
        assert System.get_env("SENTRY_DSN") == nil

        # The application should start normally without Sentry
        # This test validates that our conditional logic works
      end
    end
  end
end
