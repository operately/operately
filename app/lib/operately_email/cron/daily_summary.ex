defmodule OperatelyEmail.Cron.DailySummary do
  use Oban.Worker, queue: :mailer

  import Ecto.Query

  alias Operately.Notifications.BufferedEmailPolicy
  alias Operately.Notifications.DigestItems
  alias Operately.Notifications.Notification
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Repo
  alias OperatelyEmail.Mailers.DigestMailer

  require Logger
  @default_timezone "Etc/UTC"
  @default_daily_summary_delivery_time Operately.People.Preferences.Notifications.default_daily_summary_delivery_time()

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"person_id" => person_id}}) do
    deliver_daily_summary(person_id)
  end

  def perform(_) do
    send_daily_summaries()
  end

  def send_daily_summaries(now_utc \\ current_utc_time()) do
    people_with_daily_summary_schedule(now_utc)
    |> Enum.each(fn %{person_id: person_id, schedule_in_seconds: schedule_in_seconds} ->
      catch_and_log_errors(fn ->
        enqueue_daily_summary(person_id, schedule_in_seconds)
      end)
    end)

    :ok
  end

  def deliver_daily_summary(person_id, now_utc \\ current_utc_time()) do
    case find_eligible_person(person_id) do
      nil ->
        :ok

      person ->
        start_at = DateTime.add(now_utc, -24, :hour) |> DateTime.to_naive()
        end_at = DateTime.to_naive(now_utc)
        send_daily_summary(person, start_at, end_at)
    end
  end

  def people_who_want_daily_summary_emails do
    from(
      p in Person,
      inner_join: a in Account,
      on: p.account_id == a.id,
      inner_join: c in assoc(p, :company),
      where: not is_nil(a.email),
      where: not is_nil(p.email),
      where: fragment("COALESCE((?->'notifications'->>'send_daily_summary')::boolean, true)", p.preferences),
      where: fragment("? = ANY(?)", ^BufferedEmailPolicy.feature_name(), c.enabled_experimental_features),
      preload: [account: a, company: c]
    )
    |> Repo.all()
  end

  def people_with_daily_summary_schedule(now_utc \\ current_utc_time()) do
    now_utc = DateTime.truncate(now_utc, :second)

    # Compute each person's "now" in local time and their configured delivery clock time.
    # We validate timezone names against pg_timezone_names and fall back to UTC when invalid.
    base_query =
      from(
        p in Person,
        inner_join: a in Account,
        on: p.account_id == a.id,
        inner_join: c in assoc(p, :company),
        where: not is_nil(a.email),
        where: not is_nil(p.email),
        where: fragment("COALESCE((?->'notifications'->>'send_daily_summary')::boolean, true)", p.preferences),
        where: fragment("? = ANY(?)", ^BufferedEmailPolicy.feature_name(), c.enabled_experimental_features),
        select: %{
          person_id: p.id,
          local_now:
            fragment(
              "timezone(CASE WHEN EXISTS (SELECT 1 FROM pg_timezone_names tzn WHERE tzn.name = ?) THEN ? ELSE ? END, ?)",
              p.timezone,
              p.timezone,
              ^@default_timezone,
              ^now_utc
            ),
          delivery_time:
            fragment(
              "COALESCE((?->'notifications'->>'daily_summary_delivery_time'), ?)::time",
              p.preferences,
              ^@default_daily_summary_delivery_time
            )
        }
      )

    # Convert local "now" and local delivery clock time into seconds until the next delivery.
    # If today's time already passed, schedule for tomorrow at the same local time.
    from(row in subquery(base_query),
      select: %{
        person_id: row.person_id,
        schedule_in_seconds:
          type(
            fragment(
              "floor(extract(epoch from (CASE WHEN (date_trunc('day', ?) + ?) >= ? THEN (date_trunc('day', ?) + ?) - ? ELSE (date_trunc('day', ?) + ? + interval '1 day') - ? END)))",
              row.local_now,
              row.delivery_time,
              row.local_now,
              row.local_now,
              row.delivery_time,
              row.local_now,
              row.local_now,
              row.delivery_time,
              row.local_now
            ),
            :integer
          )
      }
    )
    |> Repo.all()
  end

  defp send_daily_summary(person, start_at, end_at) do
    notifications = notifications_for_window(person.id, start_at, end_at)
    {digest_items, _notifications_with_digest_items} = DigestItems.build(notifications, person)

    case digest_items do
      [] ->
        :ok

      _ ->
        case DigestMailer.send_daily_summary(person, digest_items) do
          {:ok, _result} ->
            :ok

          {:error, reason} ->
            Logger.error("Error sending daily summary for person #{person.id}: #{inspect(reason)}")
        end
    end
  end

  defp notifications_for_window(person_id, start_at, end_at) do
    from(
      n in Notification,
      where: n.person_id == ^person_id,
      where: n.inserted_at >= ^start_at and n.inserted_at <= ^end_at,
      join: activity in assoc(n, :activity),
      where: activity.action not in ^BufferedEmailPolicy.bypass_actions(),
      preload: [activity: activity],
      order_by: [asc: n.inserted_at]
    )
    |> Repo.all()
  end

  defp current_utc_time do
    DateTime.utc_now() |> DateTime.truncate(:second)
  end

  defp enqueue_daily_summary(person_id, schedule_in_seconds) do
    schedule_in_seconds =
      schedule_in_seconds
      |> Kernel.max(0)
      |> trunc()

    %{person_id: person_id}
    |> __MODULE__.new(schedule_in: schedule_in_seconds)
    |> Oban.insert()
    |> case do
      {:ok, _job} ->
        :ok

      {:error, reason} ->
        Logger.error("Failed to enqueue daily summary for person #{person_id}: #{inspect(reason)}")
    end
  end

  defp find_eligible_person(person_id) do
    person =
      Person
      |> Repo.get(person_id)
      |> case do
        nil -> nil
        person -> Repo.preload(person, [:account, :company])
      end

    if eligible_person?(person), do: person, else: nil
  end

  defp eligible_person?(nil), do: false

  defp eligible_person?(person) do
    person.account_id != nil and
      person.account != nil and
      person.company != nil and
      not is_nil(person.account.email) and
      not is_nil(person.email) and
      Person.send_daily_summary?(person) and
      BufferedEmailPolicy.enabled?(person.company)
  end

  defp catch_and_log_errors(cb) do
    try do
      cb.()
    rescue
      e -> Logger.error("Error in OperatelyEmail.Cron.DailySummary: #{inspect(e)}")
    end
  end
end
