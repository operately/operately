defmodule OperatelyEmail.Mailers.BillingMailer do
  @moduledoc false

  alias Operately.I18n.{EffectiveLanguage, Locale}
  alias Operately.Repo
  alias OperatelyEmail.Mailers.BaseMailer

  def deliver(recipients, company, build, job \\ nil) do
    delivered_ids = delivered_recipient_ids(job)

    recipients
    |> Enum.reject(&(Map.get(&1, :id) in delivered_ids))
    |> Enum.group_by(&EffectiveLanguage.resolve(&1, company))
    |> Enum.sort_by(fn {language, _} -> language end)
    |> Enum.reduce_while({{:ok, :no_recipients}, job}, fn {language, people}, {_result, job} ->
      with {:ok, _} = result <- deliver_group(people, language, build),
           {:ok, job} <- record_delivery(job, people) do
        {:cont, {result, job}}
      else
        {:error, _} = error -> {:halt, {error, job}}
      end
    end)
    |> elem(0)
  end

  defp deliver_group(people, language, build) do
    Gettext.with_locale(OperatelyWeb.Gettext, Locale.to_gettext(language), fn ->
      people |> build.() |> BaseMailer.deliver_now()
    end)
  end

  defp delivered_recipient_ids(nil), do: []
  defp delivered_recipient_ids(job), do: Map.get(job.meta, "delivered_recipient_ids", [])

  defp record_delivery(nil, _people), do: {:ok, nil}

  defp record_delivery(job, people) do
    ids = Enum.uniq(delivered_recipient_ids(job) ++ Enum.map(people, & &1.id))
    meta = Map.put(job.meta, "delivered_recipient_ids", ids)
    persist_progress(job, meta)
  end

  # Direct/inline worker execution has no persisted job to checkpoint.
  defp persist_progress(%Oban.Job{__meta__: %{state: :built}} = job, meta), do: {:ok, %{job | meta: meta}}
  defp persist_progress(job, meta), do: job |> Ecto.Changeset.change(meta: meta) |> Repo.update()
end
