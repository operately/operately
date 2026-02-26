defmodule OperatelyWeb.Api.ExternalQueries.Queries do
  alias OperatelyWeb.Api.ExternalQueries.Queries

  def __spec_modules__ do
    [
      Queries.GetAccount,
      Queries.GetActivities,
      Queries.GetActivity,
      Queries.GetAssignments,
      Queries.GetAssignmentsCount,
      Queries.GetBindedPeople,
      Queries.GetComments,
      Queries.GetCompanies,
      Queries.GetCompany,
      Queries.GetDiscussion,
      Queries.GetDiscussions,
      Queries.GetFlatWorkMap,
      Queries.GetGoal,
      Queries.GetGoalCheckIns,
      Queries.GetGoalProgressUpdate,
      Queries.GetGoals
    ]
  end
end
