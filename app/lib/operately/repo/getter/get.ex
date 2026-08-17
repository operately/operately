defmodule Operately.Repo.Getter.Get do
  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Repo.RequestInfo
  alias Operately.Repo.Getter.{AccessQuery, Args, AuthPreloader, BaseQuery}

  def get(module, requester, args) do
    args = Args.parse(args)
    {query, profile} = BaseQuery.build(module, args)

    case requester do
      :system -> get_for_system(query, args)
      %{id: requester_id} -> get_for_person(query, requester_id, args, profile.access_contexts)
      requester_id when is_binary(requester_id) -> get_for_person(query, requester_id, args, profile.access_contexts)
      _ -> {:error, :invalid_requester}
    end
  end

  defp get_for_system(query, args) do
    case Repo.one(query, with_deleted: args.with_deleted) do
      nil -> {:error, :not_found}
      resource -> {:ok, process_resource(resource, :system, Binding.full_access(), args)}
    end
  end

  defp get_for_person(query, requester_id, args, access_contexts) do
    query =
      AccessQuery.authorize(query, requester_id, args.required_access_level, access_contexts)
      |> group_by([resource: resource, person: person], [resource.id, person.id])
      |> select([resource: resource, binding: binding, person: person], {resource, max(binding.access_level), person})

    case Repo.one(query, with_deleted: args.with_deleted) do
      nil -> {:error, :not_found}
      {resource, access_level, requester} -> {:ok, process_resource(resource, requester, access_level, args)}
    end
  end

  defp process_resource(resource, requester, access_level, args) do
    resource
    |> RequestInfo.populate_request_info(requester, access_level)
    |> AuthPreloader.preload(requester, args)
    |> run_after_load_hooks(args.after_load)
  end

  defp run_after_load_hooks(resource, hooks) do
    Enum.reduce(hooks, resource, fn hook, resource -> hook.(resource) end)
  end
end
