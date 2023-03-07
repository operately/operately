Feature: Objectives and Key Results

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I am on the Objectives page
    When I click on the Create Objective button
    And I fill in the Objective Name field with "Maintain support happiness"
    And I fill in the Objective Description field with "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I choose "Current quarter" from the Timeframe dropdown
    And I add a Key Result with the name "Happiness score increased from 95 to 97" as "Percentage" and the target value "Above" "97"
    And I add a Key Result with the name "First response time dropped from 2 hours to 1 hour" as "Number" and the target value "Below" "1 hour"
    And I click on the Create Objective and results button
    Then I should see "Maintain support happiness" in the list of Objectives
    When I click on the "Maintain support happiness Objective"
    Then I should see "Maintain support happiness" in the Objective title
    And I should see "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers." in the Objective description
    And I should see "Current quarter" in the Objective timeframe
    And I should see "Happiness score increased from 95 to 97" in the list of Key Results
    And I should see "First response time dropped from 2 hours to 1 hour" in the list of Key Results


  # Scenario: Viewing Objectives and Key Results
  #   Given I am logged in as a user
  #   And I am on the Objectives page
  #   When I view the list of Objectives and Key Results
  #   Then I should see a list of all Objectives and their associated Key Results
  #   And I should be able to click on an Objective to view its details
