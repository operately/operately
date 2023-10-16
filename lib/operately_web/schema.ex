defmodule OperatelyWeb.Schema do
  use Absinthe.Schema

  import_types Absinthe.Type.Custom

  alias OperatelyWeb.GraphQL.{Types, Queries, Mutations}

  import_types Types.Activities
  import_types Types.Assignments
  import_types Types.Blobs
  import_types Types.Comments
  import_types Types.Companies
  import_types Types.Dashboards
  import_types Types.Groups
  import_types Types.KeyResults
  import_types Types.Kpis
  import_types Types.Milestones
  import_types Types.Objectives
  import_types Types.Person
  import_types Types.ProjectReviewRequests
  import_types Types.Projects
  import_types Types.Reactions
  import_types Types.Tenets
  import_types Types.UpdateContentMessage
  import_types Types.UpdateContentProjectContributorAdded
  import_types Types.UpdateContentProjectContributorRemoved
  import_types Types.UpdateContentProjectCreated
  import_types Types.UpdateContentProjectEndTimeChanged
  import_types Types.UpdateContentProjectMilestoneCompleted
  import_types Types.UpdateContentProjectMilestoneCreated
  import_types Types.UpdateContentProjectMilestoneDeadlineChanged
  import_types Types.UpdateContentProjectMilestoneDeleted
  import_types Types.UpdateContentProjectStartTimeChanged
  import_types Types.UpdateContentProjectDiscussion
  import_types Types.UpdateContentReview
  import_types Types.UpdateContentStatusUpdate
  import_types Types.Updates

  import_types Queries.Activities
  import_types Queries.Assignments
  import_types Queries.Companies
  import_types Queries.Groups
  import_types Queries.KeyResults
  import_types Queries.Kpis
  import_types Queries.Milestones
  import_types Queries.Objectives
  import_types Queries.People
  import_types Queries.ProjectReviewRequests
  import_types Queries.Projects
  import_types Queries.Tenets
  import_types Queries.Updates

  import_types Mutations.Blobs
  import_types Mutations.Dashboards
  import_types Mutations.Groups
  import_types Mutations.KeyResults
  import_types Mutations.Kpis
  import_types Mutations.Milestones
  import_types Mutations.Objectives
  import_types Mutations.People
  import_types Mutations.ProjectReviewRequests
  import_types Mutations.Projects
  import_types Mutations.Tenets
  import_types Mutations.Updates
  
  query do
    import_fields :activity_queries
    import_fields :assignment_queries
    import_fields :company_queries
    import_fields :group_queries
    import_fields :key_result_queries
    import_fields :kpi_queries
    import_fields :milestone_queries
    import_fields :objective_queries
    import_fields :person_queries
    import_fields :project_review_request_queries
    import_fields :project_queries
    import_fields :tenet_queries
    import_fields :update_queries
  end

  mutation do
    import_fields :blob_mutations
    import_fields :dashboard_mutations
    import_fields :group_mutations
    import_fields :key_result_mutations
    import_fields :kpi_mutations
    import_fields :milestone_mutations
    import_fields :objective_mutations
    import_fields :person_mutations
    import_fields :project_review_request_mutations
    import_fields :project_mutations
    import_fields :tenet_mutations
    import_fields :update_mutations
  end

  subscription do
    field :group_added, :group do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :project_added, :project do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :tenet_added, :tenet do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :kpi_added, :kpi do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :objective_added, :objective do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :update_added, :activity do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :comment_added, :comment do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end
  end
end
