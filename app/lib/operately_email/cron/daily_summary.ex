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

  @impl Oban.Worker
  def perform(_) do
    send_daily_summaries()
  end

  def send_daily_summaries(now_utc \\ current_utc_time()) do
    start_at = DateTime.add(now_utc, -24, :hour) |> DateTime.to_naive()
    end_at = DateTime.to_naive(now_utc)

    people_who_want_daily_summary_emails()
    |> Enum.each(fn person ->
      catch_and_log_errors(fn ->
        send_daily_summary(person, start_at, end_at)
      end)
    end)

    :ok
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

  defp send_daily_summary(person, start_at, end_at) do
    notifications = notifications_for_window(person.id, start_at, end_at)
    {digest_items, _notifications_with_digest_items} = DigestItems.build(notifications, person)

    case digest_items do
      [] ->
        :ok

      _ ->
        case DigestMailer.send_daily_summary(person, digest_items) do
          {:ok, _result} -> :ok
          {:error, reason} -> Logger.error("Error sending daily summary for person #{person.id}: #{inspect(reason)}")
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

  defp catch_and_log_errors(cb) do
    try do
      cb.()
    rescue
      e -> Logger.error("Error in OperatelyEmail.Cron.DailySummary: #{inspect(e)}")
    end
  end
end
