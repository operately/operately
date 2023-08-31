defmodule Operately.Projects.ProjectCreation do
  defstruct [:company_id, :name, :champion_id, :creator, :creator_role, :visibility]

  def run(%__MODULE__{} = params) do
  end

    # Operately.Repo.transaction(fn -> 
    #   person = context.current_account.person
    #   private = args.input.visibility != "everyone"

    #   project_attrs = %{
    #     company_id: person.company_id,
    #     creator_id: person.id,
    #     name: args.input.name,
    #     private: private,
    #   }

    #   champion_attrs = %{
    #     person_id: args.input.champion_id,
    #     responsibility: " ",
    #     role: "champion"
    #   }

    #   {:ok, project} = Operately.Projects.create_project(
    #     project_attrs, 
    #     champion_attrs
    #   )

    #   creator_role = args.input.creator_role

    #   if creator_role && creator_role != "" do
    #     if creator_role == "Reviewer" do
    #       {:ok, _} = Operately.Projects.create_contributor(%{
    #         project_id: project.id,
    #         person_id: person.id,
    #         responsibility: " ",
    #         role: :reviewer
    #       })
    #     else
    #       {:ok, _} = Operately.Projects.create_contributor(%{
    #         project_id: project.id,
    #         person_id: person.id,
    #         responsibility: creator_role,
    #         role: :contributor
    #       })
    #     end
    #   end

    #   project
    # end)

    # project_attrs = Map.put(project_attrs, :next_update_scheduled_at, first_friday_from_today())

    # Repo.transaction(fn ->
    #   result = %Project{} |> Project.changeset(project_attrs) |> Repo.insert()

    #   case result do
    #     {:ok, project} -> 
    #       {:ok, champion} = create_contributor_if_provided(champion_attrs, project.id)
    #       champion_id = if champion, do: champion.person_id, else: nil

    #       {:ok, _} = Updates.record_project_creation(
    #         project.creator_id, 
    #         project.id, 
    #         champion_id
    #       )

    #       {:ok, _} = create_phase_history(%{
    #         project_id: project.id,
    #         phase: project.phase,
    #         start_time: DateTime.utc_now()
    #       })

    #       project
    #     {:error, changeset} ->
    #       Repo.rollback(changeset)
    #   end
    # end)
end
