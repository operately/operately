defmodule Operately.Support.Api.InlineThreads do
  alias Operately.Support.{Factory, RichText}

  def setup(ctx) do
    ctx |> Factory.setup() |> add_document()
  end

  def add_document(ctx, space_opts \\ [company_permissions: 0]) do
    ctx
    |> Factory.add_space(:space, space_opts)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.log_in_person(:creator)
  end

  def inputs(ctx) do
    %{
      resource_type: "resource_hub_document",
      resource_id: Operately.ShortUuid.encode!(ctx.document.id),
      source_version: ctx.document.current_version,
      from: 1,
      to: 6,
      quote: "Hello",
      content: Jason.encode!(RichText.rich_text("Review this"))
    }
  end

  def create(ctx) do
    {200, %{thread: thread}} = OperatelyWeb.TurboCase.mutation(ctx.conn, [:inline_threads, :create], inputs(ctx))
    Map.put(ctx, :thread, thread)
  end

  def as_member(ctx, level) do
    ctx = Factory.add_company_member(ctx, :member)
    context = Operately.Access.get_context!(group_id: ctx.space.id)
    {:ok, _} = Operately.Access.bind_person(context, ctx.member.id, level)
    Factory.log_in_person(ctx, :member)
  end

  def grant_space_access(ctx, _person_key, :no_access), do: ctx

  def grant_space_access(ctx, person_key, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx[person_key].id, access_level: Operately.Access.Binding.from_atom(level)}])
    ctx
  end

  def read_only(ctx) do
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now(), access_state_ends_at: nil})
    ctx
  end
end
